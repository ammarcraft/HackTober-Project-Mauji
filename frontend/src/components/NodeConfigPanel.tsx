import React, { useState, useRef } from 'react';
import {
  X,
  BrainCircuit,
  Sliders,
  FileCode,
  Layers,
  Play,
  RotateCcw,
  Trash2,
  Copy,
  ChevronRight,
  Sparkles,
  Rows,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import {
  UniversalNodeData,
  OutputMode,
  RowMode,
  SchemaField,
} from '../types/workflow';
import { VisualSchemaBuilder } from './editors/VisualSchemaBuilder';
import { JsonSchemaCodeEditor } from './editors/JsonSchemaCodeEditor';
import { VariablePicker } from './editors/VariablePicker';
import { InputDataPreview } from './editors/InputDataPreview';
import { WorkflowInputEditor } from './editors/WorkflowInputEditor';

interface NodeConfigPanelProps {
  node: Node;
  nodes: Node[];
  edges: Edge[];
  executionResults: Record<string, any>;
  onClose: () => void;
  onUpdate: (data: Partial<UniversalNodeData>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onTestNode: (id: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  nodes,
  edges,
  executionResults,
  onClose,
  onUpdate,
  onDuplicate,
  onDelete,
  onTestNode,
}) => {
  const data: UniversalNodeData = node.data as UniversalNodeData;
  const nodeType = node.type || 'universalAi';

  const [activeTab, setActiveTab] = useState<'prompt' | 'schema' | 'rows' | 'preview'>('prompt');
  const [schemaEditorTab, setSchemaEditorTab] = useState<'visual' | 'raw'>('visual');
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Parent node details
  const directParents = edges.filter((e) => e.target === node.id).map((e) => e.source);
  const nodeLabels: Record<string, string> = {};
  nodes.forEach((n) => {
    nodeLabels[n.id] = (n.data as any)?.label || n.id;
  });

  const workflowInputNode = nodes.find((n) => n.type === 'workflowInput');
  const workflowInputs = (workflowInputNode?.data as any)?.input_fields || {};

  // Insert variable into user prompt at cursor position
  const handleInsertVariable = (variableText: string) => {
    const textarea = promptTextareaRef.current;
    if (!textarea) {
      onUpdate({ user_prompt: `${data.user_prompt || ''} ${variableText}` });
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = data.user_prompt || '';
    const updated = current.substring(0, start) + variableText + current.substring(end);
    onUpdate({ user_prompt: updated });

    // Reposition cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 50);
  };

  // Convert visual fields to JSON Schema
  const handleVisualFieldsChange = (newFields: SchemaField[]) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    newFields.forEach((f) => {
      if (f.name) {
        if (f.type === 'array') {
          properties[f.name] = {
            type: 'array',
            items: { type: f.items_type || 'string' },
            description: f.description || undefined,
          };
        } else {
          properties[f.name] = {
            type: f.type,
            description: f.description || undefined,
          };
        }
        if (f.required) required.push(f.name);
      }
    });

    const jsonSchema = {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };

    onUpdate({
      schema_fields: newFields,
      json_schema: jsonSchema,
    });
  };

  // Raw schema update
  const handleRawSchemaChange = (newSchema: Record<string, any>) => {
    onUpdate({ json_schema: newSchema });
  };

  // For Workflow Input Nodes
  if (nodeType === 'workflowInput') {
    const inputFields = data.input_fields || {};
    return (
      <div className="w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-semibold">Workflow Input Settings</h2>
              <p className="text-xs text-slate-400">Configure global starting parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Node Label</label>
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Input Parameters
              </label>
              <span className="text-[10px] text-slate-400">
                Use <code className="text-sky-300 font-mono">{'{{input.key}}'}</code> downstream
              </span>
            </div>

            <WorkflowInputEditor
              inputFields={inputFields}
              onChange={(fields) => onUpdate({ input_fields: fields })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[430px] h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/40 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="bg-transparent font-semibold text-sm text-slate-100 focus:outline-none focus:bg-slate-800/60 rounded px-1 -ml-1 border-b border-transparent focus:border-indigo-500 truncate"
              placeholder="Node Name"
            />
            <p className="text-[11px] text-slate-400 truncate">Universal AI Node</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Duplicate Node"
            onClick={() => onDuplicate(node.id)}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Delete Node"
            onClick={() => onDelete(node.id)}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Toolbar: Enabled toggle, Model, Test Node */}
      <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={data.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900"
            />
            <span>Enabled</span>
          </label>

          <select
            value={data.model || 'deepseek-v4-flash-0731'}
            onChange={(e) => onUpdate({ model: e.target.value })}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[170px] truncate"
          >
            <option value="deepseek-v4-flash-0731">DeepSeek V4 Flash (1M)</option>
            <option value="deepseek-ai/DeepSeek-V4-Flash-0731">DeepSeek V4 Flash (Full ID)</option>
            <option value="meta-llama/Llama-3-70b-instruct">Llama-3-70B</option>
            <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral-8x7B</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => onTestNode(node.id)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-md shadow-sm transition-colors cursor-pointer"
        >
          <Play className="w-3 h-3 fill-current" />
          Test Node
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'prompt'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Prompt & Logic
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schema')}
          className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'schema'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Output & Schema
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rows')}
          className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'rows'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Row Generation
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Preview & Test
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* TAB 1: PROMPT & LOGIC */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            {/* DeepSeek V4 Flash Engine Settings Card */}
            <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span>DeepSeek V4 Flash Settings</span>
                </div>
                <span className="text-[10px] bg-purple-900/60 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded-full font-mono">
                  1M Context
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Reasoning Effort</label>
                  <select
                    value={data.reasoning_effort || 'high'}
                    onChange={(e) => onUpdate({ reasoning_effort: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="high">High (Default)</option>
                    <option value="low">Low</option>
                    <option value="max">Max</option>
                    <option value="off">Off</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-300">Max Tokens</label>
                    <span className="text-[10px] font-mono text-purple-300">{data.max_tokens || 16384}</span>
                  </div>
                  <input
                    type="range"
                    min="1024"
                    max="16384"
                    step="1024"
                    value={data.max_tokens || 16384}
                    onChange={(e) => onUpdate({ max_tokens: parseInt(e.target.value, 10) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-purple-900/40 pt-1.5">
                <span>Jarvis Labs Token Factory</span>
                <span className="text-emerald-400">₹12.32 / 1M in · ₹24.64 out</span>
              </div>
            </div>
            {/* System Prompt (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  System Instructions (Optional)
                </label>
                <span className="text-[10px] text-slate-400">Role & persistent rules</span>
              </div>
              <textarea
                value={data.system_prompt || ''}
                onChange={(e) => onUpdate({ system_prompt: e.target.value })}
                rows={3}
                placeholder="Define role, persona, or persistent negative constraints..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Task Prompt (Hero Feature) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Custom Task Prompt <span className="text-indigo-400">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {data.user_prompt?.length || 0} chars
                </span>
              </div>
              <textarea
                ref={promptTextareaRef}
                value={data.user_prompt || ''}
                onChange={(e) => onUpdate({ user_prompt: e.target.value })}
                rows={9}
                placeholder="Write your custom instructions from scratch. What should the AI do? How should it process the input? What format should it produce?"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-indigo-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Variable Inserter */}
            <VariablePicker
              currentNodeId={node.id}
              nodes={nodes}
              edges={edges}
              onInsert={handleInsertVariable}
            />
          </div>
        )}

        {/* TAB 2: OUTPUT & SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-4">
            {/* Output Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Output Format Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'structured_json', 'raw_text'] as OutputMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdate({ output_mode: mode })}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium capitalize transition-all text-center ${
                      data.output_mode === mode
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Structured JSON Options */}
            {data.output_mode === 'structured_json' ? (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Schema Editor Mode</span>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSchemaEditorTab('visual')}
                      className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                        schemaEditorTab === 'visual'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Visual Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchemaEditorTab('raw')}
                      className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                        schemaEditorTab === 'raw'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Raw Schema
                    </button>
                  </div>
                </div>

                {schemaEditorTab === 'visual' ? (
                  <VisualSchemaBuilder
                    fields={data.schema_fields || []}
                    onChange={handleVisualFieldsChange}
                  />
                ) : (
                  <JsonSchemaCodeEditor
                    schema={data.json_schema || {}}
                    onChange={handleRawSchemaChange}
                  />
                )}
              </div>
            ) : data.output_mode === 'auto' ? (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-semibold block mb-1">Auto Output Mode</span>
                The node returns the response directly without requiring a predefined schema. If the model generates valid JSON, it will be automatically parsed and made accessible to downstream nodes.
              </div>
            ) : (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-semibold block mb-1">Raw Text Output</span>
                The node treats all model output as plain text without enforcing JSON formatting or validation.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ROW GENERATION */}
        {activeTab === 'rows' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Output Quantity
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ row_mode: 'single', row_count: 1 })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                    data.row_mode === 'single'
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Single Output
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ row_mode: 'multiple', row_count: data.row_count > 1 ? data.row_count : 10 })}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center ${
                    data.row_mode === 'multiple'
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  Multiple Rows (Array)
                </button>
              </div>
            </div>

            {data.row_mode === 'multiple' && (
              <div className="space-y-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Target Number of Rows
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {data.row_count || 1} records
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={data.row_count || 1}
                    onChange={(e) => onUpdate({ row_count: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1</span>
                    <span>10</span>
                    <span>25</span>
                    <span>50 rows</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={data.enforce_uniqueness}
                      onChange={(e) => onUpdate({ enforce_uniqueness: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-medium text-slate-200 block">
                        Enforce Unique Records
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Filters duplicate items and requests replacements automatically
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PREVIEW & TEST */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <InputDataPreview
              currentNodeId={node.id}
              userPrompt={data.user_prompt || ''}
              systemPrompt={data.system_prompt}
              upstreamData={executionResults}
              workflowInputs={workflowInputs}
              nodeLabels={nodeLabels}
              directParents={directParents}
            />

            {/* Test Node Execution Results if available */}
            {data.executionOutput && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Last Execution Output
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {data.executionMeta?.duration_ms}ms
                  </span>
                </div>
                <pre className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(data.executionOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
