import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Table,
  FileCode,
  FileText,
  Terminal,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Layers,
  BrainCircuit,
} from 'lucide-react';
import { Node } from '@xyflow/react';
import { ExecutionLogEntry } from '../types/workflow';
import { TableResultViewer } from './inspectors/TableResultViewer';

interface BottomPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'results' | 'logs' | 'prompts' | 'errors' | 'reasoning';
  onTabChange: (tab: 'results' | 'logs' | 'prompts' | 'errors' | 'reasoning') => void;
  nodes: Node[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  executionResults: Record<string, any>;
  logs: ExecutionLogEntry[];
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  nodes,
  selectedNodeId,
  onSelectNode,
  executionResults,
  logs,
}) => {
  const [resultViewMode, setResultViewMode] = useState<'table' | 'json' | 'text'>('table');
  const [copied, setCopied] = useState(false);

  // Available nodes with results or AI nodes
  const aiNodes = nodes.filter((n) => n.type === 'universalAi' || n.type === 'outputViewer');
  const activeNode = nodes.find((n) => n.id === selectedNodeId) || aiNodes[0];
  const activeNodeId = activeNode?.id;

  const activeResult = activeNodeId ? executionResults[activeNodeId] : null;
  const activeMeta = (activeNode?.data as any)?.executionMeta as any;
  const activeLabel = (activeNode?.data as any)?.label || activeNodeId || 'Node';

  // Determine tabular rows if available
  let tableRows: any[] | null = null;
  if (activeResult) {
    let parsedResult = activeResult;
    if (
      typeof activeResult === 'string' &&
      (activeResult.trim().startsWith('{') || activeResult.trim().startsWith('['))
    ) {
      try {
        parsedResult = JSON.parse(activeResult.trim());
      } catch {
        parsedResult = activeResult;
      }
    }

    if (Array.isArray(parsedResult)) {
      tableRows = parsedResult;
    } else if (parsedResult && typeof parsedResult === 'object') {
      if (Array.isArray(parsedResult.rows)) {
        tableRows = parsedResult.rows;
      } else if (Array.isArray(parsedResult.items)) {
        tableRows = parsedResult.items;
      } else if (Array.isArray(parsedResult.data)) {
        tableRows = parsedResult.data;
      } else if (Array.isArray(parsedResult.records)) {
        tableRows = parsedResult.records;
      } else {
        // Single object: Wrap in a 1-item array so Table View always renders!
        tableRows = [parsedResult];
      }
    }
  }

  // Copy to clipboard
  const handleCopy = () => {
    if (!activeResult) return;
    const text =
      typeof activeResult === 'string'
        ? activeResult
        : JSON.stringify(activeResult, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as JSON
  const handleExportJson = () => {
    if (!activeResult) return;
    const blob = new Blob([JSON.stringify(activeResult, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLabel.toLowerCase().replace(/\s+/g, '_')}_output.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCsv = () => {
    if (!tableRows || tableRows.length === 0) return;
    const headers = Object.keys(tableRows[0] || {});
    const csvContent = [
      headers.join(','),
      ...tableRows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            const str = Array.isArray(val) ? val.join('; ') : String(val ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLabel.toLowerCase().replace(/\s+/g, '_')}_rows.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 transition-all duration-300 flex flex-col shadow-2xl ${
        isOpen ? 'h-80' : 'h-10'
      }`}
    >
      {/* Panel Header & Navigation */}
      <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            <span>Execution Panel</span>
          </button>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                onTabChange('results');
                if (!isOpen) onToggle();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'results'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Results Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTabChange('logs');
                if (!isOpen) onToggle();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Logs ({logs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTabChange('prompts');
                if (!isOpen) onToggle();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Resolved Prompts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onTabChange('reasoning');
                if (!isOpen) onToggle();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'reasoning'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>DeepSeek Thinking</span>
              {activeMeta?.reasoning_content && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Right side: Node Selector & Export actions */}
        <div className="flex items-center gap-3">
          {aiNodes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Inspect Node:</span>
              <select
                value={activeNodeId || ''}
                onChange={(e) => onSelectNode(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {aiNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {(n.data as any)?.label || n.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'results' && activeResult && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy to clipboard"
                className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                title="Export JSON"
                className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>

              {tableRows && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  title="Export CSV"
                  className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-100 bg-emerald-950/80 border border-emerald-800/60 hover:bg-emerald-900 px-2 py-0.5 rounded transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel Body Content */}
      {isOpen && (
        <div className="flex-1 p-3 overflow-hidden bg-slate-900/90 text-slate-100 flex flex-col">
          {/* TAB 1: RESULTS INSPECTOR */}
          {activeTab === 'results' && (
            <div className="flex flex-col h-full space-y-2">
              {/* Result Toolbar */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setResultViewMode('table')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-medium transition-colors ${
                        resultViewMode === 'table'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Table className="w-3 h-3" />
                      Table View
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultViewMode('json')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-medium transition-colors ${
                        resultViewMode === 'json'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3 h-3" />
                      Raw JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultViewMode('text')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded font-medium transition-colors ${
                        resultViewMode === 'text'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      Plain Text
                    </button>
                  </div>

                  {/* Row count stats pills */}
                  {activeMeta?.row_meta && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded">
                        Valid: {activeMeta.row_meta.valid} / {activeMeta.row_meta.requested}
                      </span>
                      {activeMeta.row_meta.failed > 0 && (
                        <span className="bg-rose-950/80 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded">
                          Failed: {activeMeta.row_meta.failed}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {activeMeta?.duration_ms ? `${activeMeta.duration_ms}ms` : ''}
                </div>
              </div>

              {/* View Output */}
              <div className="flex-1 overflow-hidden">
                {!activeResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Sparkles className="w-8 h-8 text-slate-400 mb-2" />
                    <p>No output generated yet for '{activeLabel}'.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Run Workflow" or "Test Node" to generate AI results.
                    </p>
                  </div>
                ) : resultViewMode === 'table' && tableRows ? (
                  <TableResultViewer data={tableRows} />
                ) : resultViewMode === 'json' ? (
                  <pre className="h-full overflow-auto bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 leading-relaxed">
                    {JSON.stringify(activeResult, null, 2)}
                  </pre>
                ) : (
                  <pre className="h-full overflow-auto bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {typeof activeResult === 'string'
                      ? activeResult
                      : JSON.stringify(activeResult, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION LOGS */}
          {activeTab === 'logs' && (
            <div className="h-full overflow-auto font-mono text-xs space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-400 italic text-center py-6">
                  No execution logs recorded yet.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-400 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span
                      className={`font-semibold shrink-0 uppercase text-[10px] px-1 rounded ${
                        log.level === 'error'
                          ? 'bg-rose-950 text-rose-400'
                          : log.level === 'warning'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-indigo-950 text-indigo-300'
                      }`}
                    >
                      {log.level}
                    </span>
                    {log.node_id && (
                      <span className="text-cyan-400 shrink-0">({log.node_id})</span>
                    )}
                    <span
                      className={
                        log.level === 'error'
                          ? 'text-rose-300'
                          : log.level === 'warning'
                          ? 'text-amber-300'
                          : 'text-slate-200'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: RESOLVED PROMPTS */}
          {activeTab === 'prompts' && (
            <div className="h-full overflow-auto space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {activeMeta?.resolved_prompt ? (
                <div className="space-y-3">
                  {activeMeta.resolved_system_prompt && (
                    <div>
                      <div className="text-xs uppercase font-semibold text-slate-400 mb-1">
                        System Prompt Sent to AI Provider
                      </div>
                      <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300 whitespace-pre-wrap">
                        {activeMeta.resolved_system_prompt}
                      </pre>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase font-semibold text-slate-400 mb-1">
                      User Task Prompt Sent to AI Provider
                    </div>
                    <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-indigo-200 whitespace-pre-wrap">
                      {activeMeta.resolved_prompt}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs italic text-center py-6">
                  No resolved prompt record available for '{activeLabel}'. Run the node to inspect the payload.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DEEPSEEK THINKING & REASONING */}
          {activeTab === 'reasoning' && (
            <div className="h-full overflow-auto space-y-3 bg-slate-950 p-3 rounded-lg border border-purple-900/50">
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-200">
                    DeepSeek V4 Flash Chain-of-Thought Reasoning
                  </span>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono">
                  Effort: {activeMeta?.reasoning_effort || 'High'}
                </span>
              </div>
              {activeMeta?.reasoning_content ? (
                <pre className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-lg font-mono text-xs text-purple-200 leading-relaxed whitespace-pre-wrap">
                  {activeMeta.reasoning_content}
                </pre>
              ) : (
                <div className="text-slate-400 text-xs italic text-center py-8">
                  No internal reasoning trace recorded for '{activeLabel}'. Reasoning is on by default for DeepSeek V4 Flash.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
