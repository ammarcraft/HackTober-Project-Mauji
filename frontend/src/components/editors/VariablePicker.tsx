import React, { useState } from 'react';
import { Tag, Database, ArrowRightCircle, Sparkles } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

interface VariablePickerProps {
  currentNodeId: string;
  nodes: Node[];
  edges: Edge[];
  onInsert: (variableText: string) => void;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({
  currentNodeId,
  nodes,
  edges,
  onInsert,
}) => {
  const [filter, setFilter] = useState('');

  // Find direct incoming parent nodes
  const parentNodeIds = edges
    .filter((e) => e.target === currentNodeId)
    .map((e) => e.source);

  const parentNodes = nodes.filter((n) => parentNodeIds.includes(n.id));

  // Find workflow input nodes
  const inputNodes = nodes.filter((n) => n.type === 'workflowInput');

  // Build variable suggestions
  const suggestions: { category: string; icon: any; items: { label: string; value: string; desc: string }[] }[] = [];

  // 1. Workflow Inputs
  inputNodes.forEach((inNode) => {
    const fields: Record<string, any> = (inNode.data as any)?.input_fields || {};
    const items = Object.keys(fields).map((key) => ({
      label: `input.${key}`,
      value: `{{input.${key}}}`,
      desc: `Value: ${String(fields[key]).slice(0, 30)}`,
    }));
    if (items.length > 0) {
      suggestions.push({
        category: `Workflow Inputs (${inNode.data?.label || 'Input'})`,
        icon: Database,
        items,
      });
    }
  });

  // 2. Upstream Connected Nodes
  parentNodes.forEach((pNode) => {
    const pData: any = pNode.data || {};
    const label: string = String(pData.label || pNode.id);
    const slug = label.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_');
    const isMultipleRows = pData.row_mode === 'multiple';

    const items: { label: string; value: string; desc: string }[] = [];

    if (isMultipleRows) {
      items.push({
        label: `nodes.${slug}.output.rows`,
        value: `{{nodes.${slug}.output.rows}}`,
        desc: `Array of generated rows from '${label}'`,
      });
      items.push({
        label: `nodes.${pNode.id}.output.rows`,
        value: `{{nodes.${pNode.id}.output.rows}}`,
        desc: `Array of rows via node ID`,
      });
    } else {
      items.push({
        label: `nodes.${slug}.output`,
        value: `{{nodes.${slug}.output}}`,
        desc: `Full structured output of '${label}'`,
      });
      items.push({
        label: `nodes.${pNode.id}.output`,
        value: `{{nodes.${pNode.id}.output}}`,
        desc: `Output via node ID`,
      });
    }

    // If schema fields exist, suggest field references
    if (pData.schema_fields && Array.isArray(pData.schema_fields)) {
      pData.schema_fields.slice(0, 4).forEach((sf: any) => {
        if (isMultipleRows) {
          items.push({
            label: `nodes.${slug}.output.rows[0].${sf.name}`,
            value: `{{nodes.${slug}.output.rows[0].${sf.name}}}`,
            desc: `First item's ${sf.name}`,
          });
        } else {
          items.push({
            label: `nodes.${slug}.output.${sf.name}`,
            value: `{{nodes.${slug}.output.${sf.name}}}`,
            desc: `Field: ${sf.name} (${sf.type})`,
          });
        }
      });
    }

    // Direct upstream shorthand
    items.push({
      label: `upstream.output${isMultipleRows ? '.rows' : ''}`,
      value: `{{upstream.output${isMultipleRows ? '.rows' : ''}}}`,
      desc: 'Shorthand for immediate parent output',
    });

    suggestions.push({
      category: `Upstream Node: ${label}`,
      icon: Sparkles,
      items,
    });
  });

  const filteredCategories = suggestions.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.label.toLowerCase().includes(filter.toLowerCase()) ||
        item.desc.toLowerCase().includes(filter.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>Insert Variable</span>
        </div>
        <span className="text-[10px] text-slate-400">Click variable to insert into prompt</span>
      </div>

      {suggestions.length > 0 && (
        <input
          type="text"
          placeholder="Filter variables..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
      )}

      <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
        {suggestions.length === 0 ? (
          <div className="text-[11px] text-slate-400 p-2.5 bg-slate-900/60 rounded border border-dashed border-slate-800 text-center">
            Connect upstream nodes to unlock dynamic variables like{' '}
            <code className="text-indigo-300">{'{{nodes.x.output}}'}</code>.
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-[11px] text-slate-400 text-center py-2">
            No variables matching "{filter}"
          </div>
        ) : (
          filteredCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {cat.category}
              </div>
              <div className="flex flex-wrap gap-1">
                {cat.items.map((item, iIdx) => (
                  <button
                    key={iIdx}
                    type="button"
                    title={item.desc}
                    onClick={() => onInsert(item.value)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-100 border border-indigo-800/60 hover:border-indigo-600 px-2 py-0.5 rounded transition-colors group cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <ArrowRightCircle className="w-2.5 h-2.5 text-indigo-400 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
