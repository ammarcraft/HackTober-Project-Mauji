import React, { useState } from 'react';
import { Eye, Code, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface InputDataPreviewProps {
  currentNodeId: string;
  userPrompt: string;
  systemPrompt?: string;
  upstreamData: Record<string, any>;
  workflowInputs: Record<string, any>;
  nodeLabels: Record<string, string>;
  directParents: string[];
}

export const InputDataPreview: React.FC<InputDataPreviewProps> = ({
  currentNodeId,
  userPrompt,
  systemPrompt,
  upstreamData,
  workflowInputs,
  nodeLabels,
  directParents,
}) => {
  const [resolvedPrompt, setResolvedPrompt] = useState<string | null>(null);
  const [resolvedSystemPrompt, setResolvedSystemPrompt] = useState<string | null>(null);
  const [variablesFound, setVariablesFound] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'data'>('prompt');

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const res = await api.previewPrompt({
        user_prompt: userPrompt,
        system_prompt: systemPrompt,
        upstream_data: upstreamData,
        workflow_inputs: workflowInputs,
        node_labels: nodeLabels,
        direct_parents: directParents,
      });
      setResolvedPrompt(res.resolved_user_prompt);
      setResolvedSystemPrompt(res.resolved_system_prompt);
      setVariablesFound(res.variables_found || []);
    } catch (e: any) {
      console.error('Failed to preview prompt:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Input Data & Prompt Preview</span>
        </div>
        <button
          type="button"
          onClick={handlePreview}
          disabled={isLoading}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 px-2 py-0.5 rounded transition-colors"
        >
          {isLoading ? 'Resolving...' : 'Resolve Prompt'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`px-3 py-1 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'prompt'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Resolved Prompt
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`px-3 py-1 font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'data'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Incoming JSON Data
        </button>
      </div>

      {/* Content */}
      {activeTab === 'prompt' ? (
        <div className="space-y-2 text-xs">
          {resolvedPrompt !== null ? (
            <div className="space-y-2">
              {variablesFound.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Interpolated ({variablesFound.length}):</span>
                  {variablesFound.map((v, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
              {resolvedSystemPrompt && (
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">
                    System Instructions
                  </div>
                  <pre className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {resolvedSystemPrompt}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mb-0.5">
                  User Task Prompt
                </div>
                <pre className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-indigo-200 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {resolvedPrompt}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 italic text-[11px] p-3 text-center">
              Click "Resolve Prompt" to preview how upstream variables and input data are interpolated into your prompt.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400">
            Source nodes: {directParents.length > 0 ? directParents.join(', ') : 'None connected'}
          </div>
          <pre className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-emerald-300 max-h-40 overflow-y-auto">
            {JSON.stringify(
              {
                workflow_inputs: workflowInputs,
                upstream_outputs: upstreamData,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
