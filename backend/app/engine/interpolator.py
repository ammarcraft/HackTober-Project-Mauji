import re
import json
from typing import Any, Dict, List, Tuple, Set

class InterpolationError(Exception):
    pass

class VariableInterpolator:
    # Pattern to find {{ ... }} or {{...}}
    VAR_PATTERN = re.compile(r'\{\{\s*([a-zA-Z0-9_\.\[\]]+)\s*\}\}')

    @classmethod
    def extract_variables(cls, template: str) -> List[str]:
        """Extracts all variable expression keys inside {{ ... }}."""
        if not template:
            return []
        return cls.VAR_PATTERN.findall(template)

    @classmethod
    def resolve_path(cls, context: Dict[str, Any], path: str) -> Tuple[bool, Any]:
        """
        Resolves a dotted or bracketed path inside a context dict.
        Supports:
          - input.topic
          - nodes.product_gen.output.rows
          - nodes.node_1.output.rows[0].title
          - upstream.output.rows
        """
        # Normalize bracket access: e.g. rows[0] -> rows.0
        normalized = re.sub(r'\[(\d+)\]', r'.\1', path)
        parts = normalized.split('.')

        curr: Any = context
        for part in parts:
            if curr is None:
                return False, None
            if isinstance(curr, dict):
                if part in curr:
                    curr = curr[part]
                else:
                    return False, None
            elif isinstance(curr, (list, tuple)):
                if part.isdigit():
                    idx = int(part)
                    if 0 <= idx < len(curr):
                        curr = curr[idx]
                    else:
                        return False, None
                else:
                    return False, None
            else:
                return False, None

        return True, curr

    @classmethod
    def interpolate(cls, template: str, context: Dict[str, Any], strict: bool = False) -> str:
        """
        Interpolates all {{ variable }} references in the template string with values from context.
        If an object or array is injected into text, it serializes it as clean JSON.
        """
        if not template:
            return ""

        # If the entire template is exactly one variable, e.g. "{{ nodes.x.output }}", return formatted JSON or string
        trimmed = template.strip()
        full_match = cls.VAR_PATTERN.fullmatch(trimmed)
        if full_match:
            var_path = full_match.group(1)
            found, val = cls.resolve_path(context, var_path)
            if found:
                if isinstance(val, (dict, list)):
                    return json.dumps(val, indent=2, ensure_ascii=False)
                return str(val) if val is not None else ""
            elif strict:
                raise InterpolationError(f"Variable '{var_path}' could not be resolved from upstream node outputs or inputs.")
            else:
                return f"[UNRESOLVED: {var_path}]"

        def replace_match(match: re.Match) -> str:
            var_path = match.group(1)
            found, val = cls.resolve_path(context, var_path)
            if not found:
                if strict:
                    raise InterpolationError(f"Variable '{var_path}' could not be resolved from context.")
                return f"[UNRESOLVED: {var_path}]"
            
            if isinstance(val, (dict, list)):
                return json.dumps(val, indent=2, ensure_ascii=False)
            if val is None:
                return ""
            return str(val)

        return cls.VAR_PATTERN.sub(replace_match, template)

    @classmethod
    def build_node_context(
        cls,
        workflow_inputs: Dict[str, Any],
        node_results: Dict[str, Any],
        node_labels: Dict[str, str],
        direct_parents: List[str]
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive context dictionary containing:
        - input / inputs: workflow input fields
        - nodes: mapped by both node_id and slugified node label!
                 supports both {{nodes.<id>.output}} and {{nodes.<id>.output.rows}}
                 as well as direct {{nodes.<id>.rows}}
        - upstream: output of the primary / direct parent node(s)
        """
        context: Dict[str, Any] = {
            "input": workflow_inputs or {},
            "inputs": workflow_inputs or {},
            "nodes": {},
            "upstream": {}
        }

        # Populate nodes by ID and by Label Slug
        for n_id, result in node_results.items():
            node_ctx = {
                "output": result,
                **(result if isinstance(result, dict) else {})
            }
            context["nodes"][n_id] = node_ctx
            
            label = node_labels.get(n_id)
            if label:
                slug = re.sub(r'[\s_-]+', '_', re.sub(r'[^\w\s-]', '', label.lower().strip())).strip('_')
                if slug:
                    context["nodes"][slug] = node_ctx

        # Populate upstream (first direct parent or all direct parents)
        if direct_parents:
            first_parent = direct_parents[0]
            if first_parent in node_results:
                parent_result = node_results[first_parent]
                context["upstream"] = {
                    "output": parent_result,
                    **(parent_result if isinstance(parent_result, dict) else {})
                }
            if len(direct_parents) > 1:
                context["upstreams"] = [
                    {
                        "output": node_results[pid],
                        **(node_results[pid] if isinstance(node_results[pid], dict) else {})
                    }
                    for pid in direct_parents if pid in node_results
                ]

        return context
