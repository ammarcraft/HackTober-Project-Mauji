import pytest
from app.engine.interpolator import VariableInterpolator

def test_variable_interpolation_basic():
    template = "Generate ideas for brand: {{input.brand}} targeting {{input.audience}}"
    context = {
        "input": {
            "brand": "Saffron Silk",
            "audience": "young professionals"
        }
    }
    result = VariableInterpolator.interpolate(template, context)
    assert result == "Generate ideas for brand: Saffron Silk targeting young professionals"

def test_variable_interpolation_json_embedding():
    template = "Analyze these products: {{nodes.prod_gen.output.rows}}"
    context = {
        "nodes": {
            "prod_gen": {
                "output": {
                    "rows": [
                        {"id": 1, "name": "Dew Drop Serum"},
                        {"id": 2, "name": "Barrier Creme"}
                    ]
                }
            }
        }
    }
    result = VariableInterpolator.interpolate(template, context)
    assert "Dew Drop Serum" in result
    assert "Barrier Creme" in result
    # Check that it serialized as valid JSON
    assert '"name": "Dew Drop Serum"' in result

def test_variable_extraction():
    template = "Prompt with {{input.topic}} and {{nodes.node_1.output.rows}} and {{upstream.output}}"
    vars_found = VariableInterpolator.extract_variables(template)
    assert vars_found == ["input.topic", "nodes.node_1.output.rows", "upstream.output"]
