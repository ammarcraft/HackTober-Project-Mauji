import time
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas import NodeTestRequest, NodeTestResponse
from app.engine.executor import WorkflowExecutor
from app.engine.interpolator import VariableInterpolator
from app.config import settings

router = APIRouter(prefix="/nodes", tags=["Nodes"])

@router.post("/test", response_model=NodeTestResponse)
async def test_node(req: NodeTestRequest):
    """
    Executes a single node in isolation with custom or upstream sample input data,
    allowing the user to rapidly debug custom prompts, schemas, and row generation.
    """
    node_id = req.node_id
    node_data = req.node_data
    upstream_data = req.upstream_data or {}
    workflow_inputs = req.workflow_inputs or {}

    # Synthesize dummy single-node graph
    fake_node = {
        "id": node_id,
        "type": "universalAi",
        "data": node_data
    }
    
    executor = WorkflowExecutor(
        nodes=[fake_node],
        edges=[],
        workflow_inputs=workflow_inputs,
        provider_settings=req.provider_settings
    )
    # Inject upstream data into executor results so interpolator finds it
    executor.node_results = upstream_data

    start_time = time.time()
    try:
        res = await executor.execute_node(node_id)
        elapsed_ms = int((time.time() - start_time) * 1000)
        meta = executor.node_meta.get(node_id, {})

        return NodeTestResponse(
            success=True,
            output=res.get("output"),
            reasoning_content=meta.get("reasoning_content"),
            resolved_prompt=meta.get("resolved_prompt", ""),
            resolved_system_prompt=meta.get("resolved_system_prompt"),
            row_count_meta=meta.get("row_meta"),
            duration_ms=elapsed_ms,
            raw_response=meta.get("raw_content"),
            is_mock=meta.get("is_mock", True)
        )
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        meta = executor.node_meta.get(node_id, {})
        return NodeTestResponse(
            success=False,
            output=None,
            resolved_prompt=meta.get("resolved_prompt", ""),
            resolved_system_prompt=meta.get("resolved_system_prompt"),
            duration_ms=elapsed_ms,
            error=str(e),
            is_mock=meta.get("is_mock", True)
        )

@router.post("/preview-prompt")
async def preview_prompt(payload: Dict[str, Any]):
    """
    Returns the resolved system prompt and user prompt without calling the AI provider,
    showing users exactly how variables will look at runtime.
    """
    user_prompt = payload.get("user_prompt", "")
    system_prompt = payload.get("system_prompt", "")
    upstream_data = payload.get("upstream_data", {})
    workflow_inputs = payload.get("workflow_inputs", {})
    node_labels = payload.get("node_labels", {})
    direct_parents = payload.get("direct_parents", [])

    context = VariableInterpolator.build_node_context(
        workflow_inputs=workflow_inputs,
        node_results=upstream_data,
        node_labels=node_labels,
        direct_parents=direct_parents
    )

    resolved_user = VariableInterpolator.interpolate(user_prompt, context)
    resolved_sys = VariableInterpolator.interpolate(system_prompt, context) if system_prompt else ""
    variables_found = VariableInterpolator.extract_variables(user_prompt)

    return {
        "resolved_user_prompt": resolved_user,
        "resolved_system_prompt": resolved_sys,
        "variables_found": variables_found,
        "context_keys": list(context.keys())
    }
