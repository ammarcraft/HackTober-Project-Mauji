import pytest
from app.engine.executor import WorkflowExecutor

@pytest.mark.asyncio
async def test_two_connected_nodes_vertical_slice():
    """
    Vertical slice test:
    Node 1: Universal AI Node that generates product concepts.
    Node 2: Universal AI Node that consumes Node 1's output via {{nodes.node_1.output}}
    and rewrites or refines them.
    """
    nodes = [
        {
            "id": "node_1",
            "type": "universalAi",
            "data": {
                "label": "Product Generator",
                "user_prompt": "Generate 3 innovative skincare products.",
                "output_mode": "structured_json",
                "row_mode": "multiple",
                "row_count": 3,
                "json_schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "target_audience": {"type": "string"}
                    },
                    "required": ["name", "description"]
                }
            }
        },
        {
            "id": "node_2",
            "type": "universalAi",
            "data": {
                "label": "Marketing Copywriter",
                "user_prompt": "Take these generated products: {{nodes.node_1.output.rows}} and write an executive launch strategy.",
                "output_mode": "structured_json",
                "json_schema": {
                    "type": "object",
                    "properties": {
                        "campaign_name": {"type": "string"},
                        "strategy_summary": {"type": "string"},
                        "featured_products_count": {"type": "number"}
                    },
                    "required": ["campaign_name", "strategy_summary"]
                }
            }
        }
    ]
    edges = [
        {"source": "node_1", "target": "node_2"}
    ]

    executor = WorkflowExecutor(nodes=nodes, edges=edges)

    events = []
    async for event in executor.execute_workflow_stream():
        events.append(event)

    types = [e["type"] for e in events]
    assert "workflow_started" in types
    assert "node_completed" in types
    assert "workflow_completed" in types

    # Verify Node 1 produced 3 valid rows
    n1_result = executor.node_results["node_1"]
    assert "rows" in n1_result
    assert len(n1_result["rows"]) == 3
    assert "name" in n1_result["rows"][0]

    # Verify Node 2 consumed Node 1's real output in its resolved prompt
    n2_meta = executor.node_meta["node_2"]
    assert "resolved_prompt" in n2_meta
    assert n1_result["rows"][0]["name"] in n2_meta["resolved_prompt"]

    # Verify Node 2 produced valid output conforming to its own distinct schema
    n2_result = executor.node_results["node_2"]
    assert "campaign_name" in n2_result
    assert "strategy_summary" in n2_result
