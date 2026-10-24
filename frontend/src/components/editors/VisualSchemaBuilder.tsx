import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { SchemaField, SchemaFieldType } from '../../types/workflow';

interface VisualSchemaBuilderProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

export const VisualSchemaBuilder: React.FC<VisualSchemaBuilderProps> = ({ fields, onChange }) => {
  const handleAddField = () => {
    const newField: SchemaField = {
      name: `field_${fields.length + 1}`,
      type: 'string',
      required: true,
      description: '',
    };
    onChange([...fields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<SchemaField>) => {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onChange(updated);
  };

  const handleRemoveField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Visual Schema Fields ({fields.length})
        </label>
        <button
          type="button"
          onClick={handleAddField}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 px-2.5 py-1 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Field
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {fields.length === 0 ? (
          <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-800 rounded-lg text-center">
            No fields defined. Click "Add Field" or switch to JSON Schema code editor.
          </div>
        ) : (
          fields.map((field, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-2 text-xs"
            >
              <div className="flex items-center gap-2">
                {/* Field Name */}
                <input
                  type="text"
                  placeholder="field_name"
                  value={field.name}
                  onChange={(e) => handleUpdateField(idx, { name: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />

                {/* Field Type */}
                <select
                  value={field.type}
                  onChange={(e) =>
                    handleUpdateField(idx, { type: e.target.value as SchemaFieldType })
                  }
                  className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="integer">integer</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                </select>

                {/* Required toggle */}
                <label className="flex items-center gap-1 text-slate-400 text-[11px] cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                  />
                  <span>Req</span>
                </label>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveField(idx)}
                  className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description / Extra details */}
              <input
                type="text"
                placeholder="Optional description / instructions for this field"
                value={field.description || ''}
                onChange={(e) => handleUpdateField(idx, { description: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-800 rounded px-2 py-0.5 text-slate-400 text-[11px] focus:outline-none focus:border-slate-600"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
