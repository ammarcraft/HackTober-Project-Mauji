import pytest
from app.engine.validator import ResponseValidator

def test_extract_json_markdown():
    text = "Here is the JSON response you requested:\n```json\n{\"product\": \"Serum\", \"score\": 9.5}\n```\nHope this helps!"
    success, data, err = ResponseValidator.extract_json(text)
    assert success is True
    assert data == {"product": "Serum", "score": 9.5}

def test_extract_json_raw():
    text = "{\"product\": \"Serum\", \"score\": 9.5}"
    success, data, err = ResponseValidator.extract_json(text)
    assert success is True
    assert data["product"] == "Serum"

def test_schema_validation():
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "price": {"type": "number"},
            "tags": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["title", "price"]
    }
    valid_data = {"title": "Face Wash", "price": 19.99, "tags": ["clean", "vegan"]}
    is_valid, errors = ResponseValidator.validate_schema(valid_data, schema)
    assert is_valid is True
    assert len(errors) == 0

    invalid_data = {"title": "Face Wash"} # missing required 'price'
    is_valid, errors = ResponseValidator.validate_schema(invalid_data, schema)
    assert is_valid is False
    assert any("price" in e for e in errors)

def test_row_processing_and_validation():
    schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "score": {"type": "number"}
        },
        "required": ["name", "score"]
    }
    raw_rows = [
        {"name": "Item 1", "score": 8.5},
        {"name": "Item 2"}, # invalid, missing score
        {"name": "Item 1", "score": 8.5}  # duplicate
    ]
    res = ResponseValidator.process_and_validate_rows(raw_rows, schema, expected_count=3, enforce_uniqueness=True)
    assert res["meta"]["requested"] == 3
    assert res["meta"]["valid"] == 1
    assert res["meta"]["failed"] == 2
