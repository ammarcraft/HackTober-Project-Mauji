import json
import re
from typing import Any, Dict, List, Tuple, Optional
import jsonschema

class OutputValidationError(Exception):
    def __init__(self, message: str, errors: List[str] = None):
        super().__init__(message)
        self.errors = errors or []

class ResponseValidator:
    @staticmethod
    def extract_json(raw_text: str) -> Tuple[bool, Any, Optional[str]]:
        """
        Attempts to find and parse JSON from a model response.
        Handles:
          - Pure JSON: {"a": 1}
          - Markdown blocks: ```json\n{...}\n```
          - Embedded JSON within explanatory text.
        """
        if not raw_text or not raw_text.strip():
            return False, None, "Empty response received."

        text = raw_text.strip()

        # 1. Try direct json.loads
        try:
            parsed = json.loads(text)
            return True, parsed, None
        except Exception:
            pass

        # 2. Extract from markdown code blocks
        code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text, re.IGNORECASE)
        if code_block_match:
            try:
                candidate = code_block_match.group(1).strip()
                parsed = json.loads(candidate)
                return True, parsed, None
            except Exception:
                pass

        # 3. Look for the outermost { ... } or [ ... ]
        first_bracket = min([pos for pos in [text.find('{'), text.find('[')] if pos != -1], default=-1)
        if first_bracket != -1:
            opening_char = text[first_bracket]
            closing_char = '}' if opening_char == '{' else ']'
            last_bracket = text.rfind(closing_char)
            if last_bracket > first_bracket:
                candidate = text[first_bracket:last_bracket + 1]
                try:
                    parsed = json.loads(candidate)
                    return True, parsed, None
                except Exception as e:
                    return False, None, f"Found JSON markers but parsing failed: {str(e)}"

        return False, None, "No valid JSON structure found in response."

    @staticmethod
    def validate_schema(data: Any, schema: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validates JSON data against a JSON Schema using jsonschema."""
        if not schema:
            return True, []

        validator = jsonschema.Draft7Validator(schema)
        errors = []
        for error in validator.iter_errors(data):
            path = " -> ".join([str(p) for p in error.absolute_path])
            if path:
                errors.append(f"Field '{path}': {error.message}")
            else:
                errors.append(error.message)

        return (len(errors) == 0), errors

    @classmethod
    def process_and_validate_rows(
        cls,
        data: Any,
        schema: Optional[Dict[str, Any]],
        expected_count: int,
        enforce_uniqueness: bool = False
    ) -> Dict[str, Any]:
        """
        Processes a response expected to be multiple rows.
        Accepts:
          - A list of objects: [...]
          - An object containing a list: {"rows": [...]} or {"items": [...]} or {"data": [...]}
        Validates each record against the row schema if provided.
        """
        rows: List[Any] = []
        if isinstance(data, list):
            rows = data
        elif isinstance(data, dict):
            # Try to find a list property
            for key in ["rows", "items", "data", "records", "results", "products", "ideas"]:
                if key in data and isinstance(data[key], list):
                    rows = data[key]
                    break
            if not rows:
                # If single dict, wrap in list
                rows = [data]
        else:
            rows = [data]

        valid_rows = []
        invalid_rows = []
        seen = set()

        for idx, row in enumerate(rows):
            is_valid = True
            row_errors = []

            if schema:
                is_valid, row_errors = cls.validate_schema(row, schema)

            if is_valid and enforce_uniqueness:
                row_str = json.dumps(row, sort_keys=True) if isinstance(row, (dict, list)) else str(row)
                if row_str in seen:
                    is_valid = False
                    row_errors.append("Duplicate record detected (enforce_uniqueness is active).")
                else:
                    seen.add(row_str)

            if is_valid:
                valid_rows.append(row)
            else:
                invalid_rows.append({
                    "index": idx,
                    "record": row,
                    "errors": row_errors
                })

        return {
            "rows": valid_rows,
            "invalid_records": invalid_rows,
            "meta": {
                "requested": expected_count,
                "generated": len(rows),
                "valid": len(valid_rows),
                "failed": len(invalid_rows),
                "is_complete": len(valid_rows) >= expected_count
            }
        }
