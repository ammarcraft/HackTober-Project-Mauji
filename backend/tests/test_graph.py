import pytest
from app.engine.graph import WorkflowGraphEngine, GraphValidationError

def test_dag_validation_success():
    nodes = [{"id": "n1"}, {"id": "n2"}, {"id": "n3"}]
    edges = [
        {"source": "n1", "target": "n2"},
        {"source": "n2", "target": "n3"}
    ]
    engine = WorkflowGraphEngine(nodes, edges)
    assert engine.validate_dag() is True
    batches = engine.get_topological_batches()
    assert batches == [["n1"], ["n2"], ["n3"]]

def test_dag_cycle_detection():
    nodes = [{"id": "n1"}, {"id": "n2"}, {"id": "n3"}]
    edges = [
        {"source": "n1", "target": "n2"},
        {"source": "n2", "target": "n3"},
        {"source": "n3", "target": "n1"}  # cycle!
    ]
    engine = WorkflowGraphEngine(nodes, edges)
    with pytest.raises(GraphValidationError) as exc:
        engine.get_topological_batches()
    assert "cycle" in str(exc.value).lower()

def test_parallel_batches():
    nodes = [{"id": "input"}, {"id": "branch_a"}, {"id": "branch_b"}, {"id": "join"}]
    edges = [
        {"source": "input", "target": "branch_a"},
        {"source": "input", "target": "branch_b"},
        {"source": "branch_a", "target": "join"},
        {"source": "branch_b", "target": "join"}
    ]
    engine = WorkflowGraphEngine(nodes, edges)
    batches = engine.get_topological_batches()
    assert batches[0] == ["input"]
    assert set(batches[1]) == {"branch_a", "branch_b"}
    assert batches[2] == ["join"]
