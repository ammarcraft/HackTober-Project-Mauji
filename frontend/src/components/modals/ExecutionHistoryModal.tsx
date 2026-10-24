import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { ExecutionRecord } from '../../types/workflow';
import { api } from '../../services/api';

interface ExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string | null;
}

export const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  isOpen,
  onClose,
  workflowId,
}) => {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExec, setSelectedExec] = useState<ExecutionRecord | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getExecutions(workflowId || undefined);
      setExecutions(data);
      if (data.length > 0) setSelectedExec(data[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, workflowId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl h-[550px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm">Execution History</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Split list and detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Runs List */}
          <div className="w-72 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60">
            {executions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                {loading ? 'Loading history...' : 'No past executions recorded.'}
              </div>
            ) : (
              executions.map((exec) => (
                <button
                  key={exec.id}
                  onClick={() => setSelectedExec(exec)}
                  className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 ${
                    selectedExec?.id === exec.id
                      ? 'bg-indigo-950/40 text-indigo-200'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  {exec.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold capitalize">{exec.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {exec.duration_ms ? `${exec.duration_ms}ms` : ''}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(exec.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Run Detail */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-950/60 space-y-3">
            {selectedExec ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs">
                    <span className="text-slate-400">Execution ID: </span>
                    <span className="font-mono text-slate-200">{selectedExec.id}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      selectedExec.status === 'success'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {selectedExec.status}
                  </span>
                </div>

                {/* Logs */}
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-1">Execution Logs</div>
                  <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto leading-relaxed">
                    {selectedExec.logs?.length
                      ? selectedExec.logs.map((l) => `[${l.level.toUpperCase()}] ${l.message}`).join('\n')
                      : 'No log output captured.'}
                  </pre>
                </div>

                {/* Node Results */}
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-1">Node Output Payload</div>
                  <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-indigo-300 max-h-56 overflow-y-auto">
                    {JSON.stringify(selectedExec.node_results, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Select an execution to inspect logs and results.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
