export type OutputMode = 'auto' | 'structured_json' | 'raw_text';
export type RowMode = 'single' | 'multiple';
export type SchemaFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export interface SchemaField {
  name: string;
  type: SchemaFieldType;
  description?: string;
  required: boolean;
  items_type?: string;
  properties?: SchemaField[];
}

export type NodeExecutionStatus = 'idle' | 'ready' | 'running' | 'success' | 'failed' | 'skipped';

export interface RowCountMeta {
  requested: number;
  generated: number;
  valid: number;
  failed: number;
  is_complete: boolean;
}

export interface NodeExecutionMeta {
  duration_ms?: number;
  tokens_used?: number;
  model?: string;
  is_mock?: boolean;
  resolved_prompt?: string;
  resolved_system_prompt?: string;
  row_meta?: RowCountMeta;
  reasoning_content?: string;
  error?: string;
  raw_content?: string;
}

export interface UniversalNodeData extends Record<string, any> {
  label: string;
  description?: string;
  model?: string;
  enabled: boolean;
  system_prompt?: string;
  user_prompt: string;
  output_mode: OutputMode;
  json_schema?: Record<string, any>;
  schema_fields?: SchemaField[];
  row_mode: RowMode;
  row_count: number;
  enforce_uniqueness: boolean;
  reasoning_effort?: 'low' | 'high' | 'max' | 'off';
  max_tokens?: number;
  upstream_data_mode?: 'all' | 'field' | 'selected';
  selected_field?: string;
  test_input_data?: Record<string, any>;
  input_fields?: Record<string, any>;
  output_view_mode?: 'table' | 'json' | 'text';
  executionStatus?: NodeExecutionStatus;
  executionOutput?: any;
  executionMeta?: NodeExecutionMeta;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description?: string;
  graph_data: {
    nodes: any[];
    edges: any[];
    viewport?: any;
  };
  created_at: string;
  updated_at: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  node_id?: string;
  data?: any;
}

export interface ExecutionRecord {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  node_results: Record<string, any>;
  logs: ExecutionLogEntry[];
}

export interface ProviderSettings {
  api_key: string;
  base_url: string;
  model: string;
  is_mock: boolean;
}
