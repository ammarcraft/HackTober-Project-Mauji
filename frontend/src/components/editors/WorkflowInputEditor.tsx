import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Check, Code, LayoutList } from 'lucide-react';

interface WorkflowInputEditorProps {
  inputFields: Record<string, any>;
  onChange: (fields: Record<string, any>) => void;
}

export const WorkflowInputEditor: React.FC<WorkflowInputEditorProps> = ({
  inputFields,
  onChange,
}) => {
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(inputFields || {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync json text when inputFields changes externally
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonText);
      if (JSON.stringify(parsed) !== JSON.stringify(inputFields)) {
        setJsonText(JSON.stringify(inputFields || {}, null, 2));
      }
    } catch {
      setJsonText(JSON.stringify(inputFields || {}, null, 2));
    }
  }, [inputFields]);

  const entries = Object.entries(inputFields || {});

  const handleUpdateKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    const updated: Record<string, any> = {};
    for (const [k, v] of Object.entries(inputFields)) {
      if (k === oldKey) {
        updated[newKey.trim()] = v;
      } else {
        updated[k] = v;
      }
    }
    onChange(updated);
  };

  const handleUpdateValue = (key: string, value: string) => {
    onChange({
      ...inputFields,
      [key]: value,
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
    onChange({
      ...inputFields,
      [newKey]: '',
    });
  };

  const handleDeleteField = (key: string) => {
    const updated = { ...inputFields };
    delete updated[key];
    onChange(updated);
  };

  const handleCopyTag = (key: string) => {
    navigator.clipboard.writeText(`{{input.${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        setJsonError(null);
        onChange(parsed);
      } else {
        setJsonError('Input parameters must be a JSON object.');
      }
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="space-y-3">
      {/* View Mode Toggle & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('form')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'form'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Form Fields</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('json')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'json'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>

        {viewMode === 'form' && (
          <button
            type="button"
            onClick={handleAddField}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-white bg-sky-950/80 hover:bg-sky-900 border border-sky-800/80 px-2.5 py-1 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        )}
      </div>

      {/* FORM FIELDS VIEW */}
      {viewMode === 'form' ? (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <p>No input parameters defined yet.</p>
              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add your first parameter
              </button>
            </div>
          ) : (
            entries.map(([key, val], idx) => (
              <div
                key={idx}
                className="bg-slate-950/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 space-y-2 shadow-sm transition-colors group"
              >
                {/* Field Header: Key Name & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 shrink-0">
                      KEY:
                    </span>
                    <input
                      type="text"
                      defaultValue={key}
                      onBlur={(e) => handleUpdateKey(key, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateKey(key, (e.target as HTMLInputElement).value);
                        }
                      }}
                      className="bg-slate-900 border border-slate-700/80 focus:border-sky-500 rounded px-2 py-0.5 text-xs font-mono text-sky-300 focus:outline-none w-36 truncate"
                      placeholder="key_name"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Copy variable chip */}
                    <button
                      type="button"
                      title="Copy variable syntax"
                      onClick={() => handleCopyTag(key)}
                      className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800 px-1.5 py-0.5 rounded transition-colors"
                    >
                      {copiedKey === key ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                      <span>{copiedKey === key ? 'Copied' : `{{input.${key}}}`}</span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      title="Delete field"
                      onClick={() => handleDeleteField(key)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Field Value: Quick Editable Textarea */}
                <div>
                  <textarea
                    rows={2}
                    value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                    onChange={(e) => handleUpdateValue(key, e.target.value)}
                    placeholder="Enter parameter value..."
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-sky-500 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none leading-relaxed resize-y"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* RAW JSON VIEW */
        <div className="space-y-2">
          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-sky-300 leading-relaxed focus:outline-none focus:border-sky-500"
            placeholder='{ "key": "value" }'
          />
          {jsonError && (
            <p className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2 rounded">
              Invalid JSON: {jsonError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
