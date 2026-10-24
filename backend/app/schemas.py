from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field
from datetime import datetime

class SchemaField(BaseModel):
    name: str
    type: Literal["string", "number", "integer", "boolean", "array", "object"] = "string"
    description: Optional[str] = ""
    required: bool = True
    items_type: Optional[str] = "string"
    properties: Optional[List["SchemaField"]] = None

class UniversalNodeData(BaseModel):
    label: str = "Universal AI Node"
    description: Optional[str] = ""
    model: Optional[str] = "deepseek-v4-flash-0731"
    enabled: bool = True
    system_prompt: Optional[str] = ""
    user_prompt: str = ""
    output_mode: Literal["auto", "structured_json", "raw_text"] = "auto"
    json_schema: Optional[Dict[str, Any]] = None
    schema_fields: Optional[List[SchemaField]] = None
    row_mode: Literal["single", "multiple"] = "single"
    row_count: int = 1
    enforce_uniqueness: bool = False
    reasoning_effort: Optional[Literal["low", "high", "max", "off"]] = "high"
    max_tokens: Optional[int] = 16384
    upstream_data_mode: Literal["all", "field", "selected"] = "all"
    selected_field: Optional[str] = None
    test_input_data: Optional[Dict[str, Any]] = None
    
    # Extra node attributes for Input or Output viewer nodes
    input_fields: Optional[Dict[str, Any]] = None
    output_view_mode: Optional[str] = "table"

class FlowNode(BaseModel):
    id: str
    type: str = "universalAi"
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 100.0, "y": 100.0})
    data: Dict[str, Any] = Field(default_factory=dict)

class FlowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class WorkflowGraph(BaseModel):
    nodes: List[FlowNode] = Field(default_factory=list)
    edges: List[FlowEdge] = Field(default_factory=list)
    viewport: Optional[Dict[str, Any]] = None

class WorkflowCreate(BaseModel):
    name: str = "New AI Workflow"
    description: Optional[str] = ""
    graph_data: WorkflowGraph = Field(default_factory=WorkflowGraph)

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph_data: Optional[WorkflowGraph] = None

class WorkflowOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    graph_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExecutionOut(BaseModel):
    id: str
    workflow_id: str
    status: str
    started_at: datetime
    finished_at: Optional[datetime]
    duration_ms: Optional[int]
    node_results: Dict[str, Any]
    logs: List[Dict[str, Any]]

    class Config:
        from_attributes = True

class NodeTestRequest(BaseModel):
    node_id: str
    node_data: Dict[str, Any]
    upstream_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    workflow_inputs: Optional[Dict[str, Any]] = Field(default_factory=dict)
    provider_settings: Optional[Dict[str, Any]] = None

class NodeTestResponse(BaseModel):
    success: bool
    output: Any
    reasoning_content: Optional[str] = None
    resolved_prompt: str
    resolved_system_prompt: Optional[str]
    row_count_meta: Optional[Dict[str, Any]] = None
    validation_errors: Optional[List[str]] = None
    duration_ms: int = 0
    raw_response: Optional[str] = None
    is_mock: bool = False
    error: Optional[str] = None

class ProviderSettings(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = "https://models.jarvislabs.net/v1"
    model: Optional[str] = "deepseek-v4-flash-0731"
    is_mock: bool = False

class ProviderTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: int = 0
    models_available: List[str] = Field(default_factory=list)
