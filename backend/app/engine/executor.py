import asyncio
import time
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, AsyncGenerator

from app.engine.graph import WorkflowGraphEngine, GraphValidationError
from app.engine.interpolator import VariableInterpolator, InterpolationError
from app.engine.validator import ResponseValidator, OutputValidationError
from app.providers.jarvis_labs import JarvisLabsAdapter
from app.providers.mock_provider import IntelligentMockProvider
from app.config import settings

class WorkflowExecutor:
    def __init__(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        workflow_inputs: Optional[Dict[str, Any]] = None,
        provider_settings: Optional[Dict[str, Any]] = None
    ):
        self.nodes = nodes
        self.edges = edges
        self.workflow_inputs = workflow_inputs or {}
        self.provider_settings = provider_settings or {}
        
        self.node_map = {n["id"]: n for n in nodes}
        self.graph_engine = WorkflowGraphEngine(nodes, edges)
        
        # State tracking
        self.node_states: Dict[str, str] = {n["id"]: "idle" for n in nodes}
        self.node_results: Dict[str, Any] = {}
        self.node_logs: List[Dict[str, Any]] = []
        self.node_meta: Dict[str, Any] = {}
        self.is_cancelled = False

    def _get_provider(self, node_data: Dict[str, Any]):
        api_key = self.provider_settings.get("api_key") or settings.JARVIS_LABS_API_KEY
        base_url = self.provider_settings.get("base_url") or settings.JARVIS_LABS_BASE_URL

        # Determine mock mode:
        # If no API key is provided, fall back to mock.
        # If API key exists, only use mock if explicitly requested in provider_settings or config.
        if not api_key:
            return IntelligentMockProvider()

        is_mock_setting = self.provider_settings.get("is_mock")
        if is_mock_setting is True:
            return IntelligentMockProvider()
        elif is_mock_setting is None and settings.MOCK_AI_PROVIDER:
            return IntelligentMockProvider()

        return JarvisLabsAdapter(
            api_key=api_key,
            base_url=base_url,
            default_model=node_data.get("model") or settings.DEFAULT_MODEL
        )

    def log(self, message: str, level: str = "info", node_id: Optional[str] = None, data: Optional[Dict[str, Any]] = None):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": message,
            "node_id": node_id,
            "data": data or {}
        }
        self.node_logs.append(entry)
        return entry

    async def execute_node(self, node_id: str) -> Dict[str, Any]:
        """Executes a single node, handling inputs, prompt interpolation, AI call, and schema validation."""
        node = self.node_map[node_id]
        node_type = node.get("type", "universalAi")
        data = node.get("data", {})
        label = data.get("label", node_id)

        # Check enabled state
        if not data.get("enabled", True):
            self.node_states[node_id] = "skipped"
            self.log(f"Node '{label}' ({node_id}) is disabled, skipping.", level="warning", node_id=node_id)
            return {"skipped": True, "output": None}

        self.node_states[node_id] = "running"
        start_time = time.time()
        self.log(f"Starting execution of '{label}'...", node_id=node_id)

        try:
            # 1. Workflow Input Node
            if node_type in ("workflowInput", "input"):
                input_fields = data.get("input_fields") or {}
                combined_inputs = {**self.workflow_inputs, **input_fields}
                output = combined_inputs
                elapsed_ms = int((time.time() - start_time) * 1000)
                self.node_states[node_id] = "success"
                self.node_results[node_id] = output
                self.node_meta[node_id] = {"duration_ms": elapsed_ms, "is_mock": False}
                self.log(f"Input Node '{label}' loaded {len(combined_inputs)} input keys in {elapsed_ms}ms.", node_id=node_id)
                return {"success": True, "output": output, "meta": self.node_meta[node_id]}

            # 2. Output Viewer Node
            if node_type in ("outputViewer", "output"):
                parents = self.graph_engine.get_direct_parents(node_id)
                output = {}
                if parents:
                    first_parent = parents[0]
                    output = self.node_results.get(first_parent, {})
                elapsed_ms = int((time.time() - start_time) * 1000)
                self.node_states[node_id] = "success"
                self.node_results[node_id] = output
                self.node_meta[node_id] = {"duration_ms": elapsed_ms, "is_mock": False}
                self.log(f"Output Node '{label}' captured results in {elapsed_ms}ms.", node_id=node_id)
                return {"success": True, "output": output, "meta": self.node_meta[node_id]}

            # 3. Transformer / Filter Node
            if node_type == "transformer":
                parents = self.graph_engine.get_direct_parents(node_id)
                parent_data = self.node_results.get(parents[0], {}) if parents else {}
                output = parent_data
                elapsed_ms = int((time.time() - start_time) * 1000)
                self.node_states[node_id] = "success"
                self.node_results[node_id] = output
                return {"success": True, "output": output, "meta": {"duration_ms": elapsed_ms}}

            # 4. Universal AI Node
            direct_parents = self.graph_engine.get_direct_parents(node_id)
            node_labels = {nid: self.node_map[nid].get("data", {}).get("label", nid) for nid in self.node_map}
            context = VariableInterpolator.build_node_context(
                self.workflow_inputs,
                self.node_results,
                node_labels,
                direct_parents
            )

            # Interpolate prompts
            raw_user_prompt = data.get("user_prompt", "")
            raw_system_prompt = data.get("system_prompt", "")

            resolved_user_prompt = VariableInterpolator.interpolate(raw_user_prompt, context)
            resolved_system_prompt = VariableInterpolator.interpolate(raw_system_prompt, context) if raw_system_prompt else None

            # Get settings
            output_mode = data.get("output_mode", "auto")
            json_schema = data.get("json_schema")
            row_mode = data.get("row_mode", "single")
            row_count = int(data.get("row_count", 1))
            enforce_uniqueness = bool(data.get("enforce_uniqueness", False))
            model = data.get("model") or settings.DEFAULT_MODEL

            provider = self._get_provider(data)

            # Execution with bounded retries for JSON correction
            max_validation_retries = settings.DEFAULT_MAX_RETRIES
            current_prompt = resolved_user_prompt
            final_output = None
            validation_errors: List[str] = []
            provider_resp = None
            row_meta = None

            for attempt in range(max_validation_retries + 1):
                provider_resp = await provider.generate(
                    prompt=current_prompt,
                    system_prompt=resolved_system_prompt,
                    model=model,
                    output_mode=output_mode,
                    json_schema=json_schema,
                    row_mode=row_mode,
                    row_count=row_count,
                    reasoning_effort=data.get("reasoning_effort", "high"),
                    max_tokens=int(data.get("max_tokens") or settings.DEFAULT_MAX_TOKENS)
                )

                content = provider_resp.content

                if output_mode == "raw_text":
                    final_output = content
                    break

                # Extract JSON
                success, parsed_json, parse_err = ResponseValidator.extract_json(content)
                if not success:
                    if output_mode == "auto":
                        # Auto mode allows falling back to raw text
                        final_output = content
                        break
                    else:
                        validation_errors = [f"JSON Parse Error: {parse_err}"]
                        if attempt < max_validation_retries:
                            current_prompt = (
                                f"{resolved_user_prompt}\n\n"
                                f"CORRECTION REQUIRED: Your previous output was not valid JSON ({parse_err}). "
                                f"Please return valid JSON strictly adhering to requirements."
                            )
                            self.log(f"Node '{label}' JSON parse failed on attempt {attempt + 1}, retrying...", level="warning", node_id=node_id)
                            continue
                        else:
                            raise OutputValidationError(f"Failed to generate valid JSON: {parse_err}", validation_errors)

                # Validate Structured JSON
                if output_mode == "structured_json" and json_schema:
                    if row_mode == "multiple" and row_count > 1:
                        row_results = ResponseValidator.process_and_validate_rows(
                            parsed_json,
                            json_schema,
                            expected_count=row_count,
                            enforce_uniqueness=enforce_uniqueness
                        )
                        row_meta = row_results["meta"]
                        final_output = row_results
                        if row_meta["valid"] == 0 and attempt < max_validation_retries:
                            first_err = row_results["invalid_records"][0]["errors"] if row_results["invalid_records"] else ["Unknown error"]
                            current_prompt = (
                                f"{resolved_user_prompt}\n\n"
                                f"CORRECTION REQUIRED: Generated rows failed schema validation ({first_err}). "
                                f"Please correct and output valid JSON."
                            )
                            continue
                        break
                    else:
                        is_valid, errors = ResponseValidator.validate_schema(parsed_json, json_schema)
                        if not is_valid:
                            validation_errors = errors
                            if attempt < max_validation_retries:
                                current_prompt = (
                                    f"{resolved_user_prompt}\n\n"
                                    f"CORRECTION REQUIRED: The output failed schema validation: {', '.join(errors[:3])}. "
                                    f"Please correct the JSON structure."
                                )
                                self.log(f"Node '{label}' schema error on attempt {attempt + 1}: {errors[:2]}, retrying...", level="warning", node_id=node_id)
                                continue
                            else:
                                raise OutputValidationError(f"Schema validation failed: {', '.join(errors)}", validation_errors)
                        final_output = parsed_json
                        break
                else: # auto mode with valid JSON
                    if row_mode == "multiple" and row_count > 1:
                        row_results = ResponseValidator.process_and_validate_rows(
                            parsed_json,
                            None,
                            expected_count=row_count,
                            enforce_uniqueness=enforce_uniqueness
                        )
                        row_meta = row_results["meta"]
                        final_output = row_results
                    else:
                        final_output = parsed_json
                    break

            elapsed_ms = int((time.time() - start_time) * 1000)
            self.node_states[node_id] = "success"
            self.node_results[node_id] = final_output
            self.node_meta[node_id] = {
                "duration_ms": elapsed_ms,
                "model": model,
                "is_mock": provider_resp.is_mock if provider_resp else False,
                "tokens_used": provider_resp.tokens_used if provider_resp else 0,
                "resolved_prompt": resolved_user_prompt,
                "resolved_system_prompt": resolved_system_prompt,
                "row_meta": row_meta,
                "reasoning_content": provider_resp.reasoning_content if provider_resp else None,
                "raw_content": provider_resp.content if provider_resp else ""
            }

            self.log(
                f"Node '{label}' succeeded in {elapsed_ms}ms ({'Mock' if provider_resp.is_mock else 'Jarvis Labs'}).",
                node_id=node_id,
                data={"meta": self.node_meta[node_id]}
            )

            return {
                "success": True,
                "output": final_output,
                "meta": self.node_meta[node_id]
            }

        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            self.node_states[node_id] = "failed"
            error_msg = str(e)
            self.log(f"Node '{label}' failed after {elapsed_ms}ms: {error_msg}", level="error", node_id=node_id)
            self.node_meta[node_id] = {"duration_ms": elapsed_ms, "error": error_msg}
            raise e

    async def execute_workflow_stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Executes the entire workflow according to topological order,
        streaming execution events (node_started, node_completed, etc.).
        """
        yield {"type": "workflow_started", "timestamp": datetime.now(timezone.utc).isoformat()}
        self.log("Validating workflow graph...")

        try:
            batches = self.graph_engine.get_topological_batches()
            self.log(f"Graph validated successfully. Found {len(batches)} execution stages.")
        except GraphValidationError as e:
            self.log(f"Graph validation failed: {str(e)}", level="error")
            yield {
                "type": "workflow_failed",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            return

        workflow_start = time.time()

        for stage_idx, batch in enumerate(batches):
            if self.is_cancelled:
                yield {"type": "workflow_cancelled", "timestamp": datetime.now(timezone.utc).isoformat()}
                return

            self.log(f"Starting Stage {stage_idx + 1}/{len(batches)} with {len(batch)} parallel node(s): {batch}")

            # Notify nodes starting
            for nid in batch:
                yield {
                    "type": "node_started",
                    "node_id": nid,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

            # Execute batch concurrently
            tasks = [self.execute_node(nid) for nid in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            has_failure = False
            for nid, res in zip(batch, results):
                if isinstance(res, Exception):
                    has_failure = True
                    yield {
                        "type": "node_failed",
                        "node_id": nid,
                        "error": str(res),
                        "meta": self.node_meta.get(nid, {}),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    yield {
                        "type": "node_completed",
                        "node_id": nid,
                        "output": self.node_results.get(nid),
                        "meta": self.node_meta.get(nid, {}),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }

            if has_failure:
                total_duration = int((time.time() - workflow_start) * 1000)
                self.log(f"Workflow terminated due to errors in Stage {stage_idx + 1}.", level="error")
                yield {
                    "type": "workflow_failed",
                    "error": "One or more nodes failed execution.",
                    "duration_ms": total_duration,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                return

        total_duration = int((time.time() - workflow_start) * 1000)
        self.log(f"Workflow completed successfully in {total_duration}ms.")
        yield {
            "type": "workflow_completed",
            "duration_ms": total_duration,
            "node_results": self.node_results,
            "logs": self.node_logs,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
