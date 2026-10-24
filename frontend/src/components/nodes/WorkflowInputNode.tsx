import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { PlayCircle, Database, Plus, Trash2, Check, Copy } from 'lucide-react';
import { UniversalNodeData } from '../../types/workflow';

interface WorkflowInputNodeProps {
  id: string;
  data: UniversalNodeData;
  selected: boolean;
}

export const WorkflowInputNode: React.FC<WorkflowInputNodeProps> = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();
  const inputFields = data.input_fields || {};
  const keys = Object.keys(inputFields);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const updateFields = (newFields: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            data: {
              ...n.data,
              input_fields: newFields,
            },
          };
        }
        return n;
      })
    );
  };

  const handleValueChange = (key: string, val: string) => {
    updateFields({
      ...inputFields,
      [key]: val,
    });
  };

  const handleAddField = () => {
    const baseKey = 'param';
    let newKey = baseKey;
    let counter = 1;
    while (newKey in inputFields) {
      newKey = `${baseKey}_${counter}`;
      counter++;
    }
    updateFields({
      ...inputFields,
      [newKey]: '',
    });
  };

  const handleDeleteField = (key: string) => {
    const updated = { ...inputFields };
    delete updated[key];
    updateFields(updated);
  };

  const handleCopyTag = (key: string) => {
    navigator.clipboard.writeText(`{{input.${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div
      className={`relative w-80 rounded-xl bg-slate-900/95 backdrop-blur-md border ${
        selected ? 'border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.35)]' : 'border-slate-800 hover:border-slate-700'
      } transition-all duration-200 text-slate-100 shadow-xl overflow-hidden`}
    >
      {/* Top status bar accent */}
      <div className="h-1 w-full bg-sky-500" />

      {/* Node Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-950/80 text-sky-400 border border-sky-800/40 flex items-center justify-center shrink-0">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
              {data.label || 'Workflow Input'}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">Entry trigger variables</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddField}
          title="Add new input parameter"
          className="nodrag nopan inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300 bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
        >
          <Plus className="w-2.5 h-2.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Node Body: Direct Editable Fields */}
      <div className="p-3.5 space-y-2">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 flex items-center justify-between">
          <span>Editable Parameters ({keys.length})</span>
          <Database className="w-3 h-3 text-slate-400" />
        </div>

        <div className="nodrag nopan space-y-2 max-h-56 overflow-y-auto pr-1">
          {keys.length === 0 ? (
            <div className="p-3 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
              No parameters yet. Click "+ Add" above.
            </div>
          ) : (
            keys.map((k) => (
              <div
                key={k}
                className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-sky-300 font-semibold truncate max-w-[140px]">
                    {k}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Copy variable tag"
                      onClick={() => handleCopyTag(k)}
                      className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                    >
                      {copiedKey === k ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                    <button
                      type="button"
                      title="Delete field"
                      onClick={() => handleDeleteField(k)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors opacity-40 group-hover:opacity-100"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={typeof inputFields[k] === 'object' ? JSON.stringify(inputFields[k]) : String(inputFields[k] ?? '')}
                  onChange={(e) => handleValueChange(k, e.target.value)}
                  placeholder="Enter value..."
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Source handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-sky-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
    </div>
  );
};
