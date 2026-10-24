import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';

interface JsonSchemaCodeEditorProps {
  schema: Record<string, any>;
  onChange: (schema: Record<string, any>) => void;
}

export const JsonSchemaCodeEditor: React.FC<JsonSchemaCodeEditorProps> = ({ schema, onChange }) => {
  const [text, setText] = useState<string>(() => JSON.stringify(schema || {}, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const currentParsed = JSON.parse(text);
      if (JSON.stringify(currentParsed) !== JSON.stringify(schema)) {
        setText(JSON.stringify(schema || {}, null, 2));
        setError(null);
      }
    } catch {
      setText(JSON.stringify(schema || {}, null, 2));
      setError(null);
    }
  }, [schema]);

  const handleTextChange = (newVal: string) => {
    setText(newVal);
    try {
      const parsed = JSON.parse(newVal);
      setError(null);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Raw JSON Schema
        </label>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        rows={10}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-indigo-300 leading-relaxed focus:outline-none focus:border-indigo-500 selection:bg-indigo-900"
        placeholder='{ "type": "object", "properties": { ... } }'
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono text-[11px] truncate">Invalid JSON: {error}</span>
        </div>
      )}
    </div>
  );
};
