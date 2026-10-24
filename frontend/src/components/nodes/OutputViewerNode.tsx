import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Table, Eye, Download, CheckCircle2 } from 'lucide-react';
import { UniversalNodeData } from '../../types/workflow';

interface OutputViewerNodeProps {
  id: string;
  data: UniversalNodeData;
  selected: boolean;
}

export const OutputViewerNode: React.FC<OutputViewerNodeProps> = ({ id, data, selected }) => {
  const hasOutput = Boolean(data.executionOutput);

  return (
    <div
      className={`relative w-72 rounded-xl bg-slate-900/95 backdrop-blur-md border ${
        selected ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'border-slate-800 hover:border-slate-700'
      } transition-all duration-200 text-slate-100 shadow-xl overflow-hidden`}
    >
      {/* Target handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />

      {/* Top accent */}
      <div className="h-1 w-full bg-emerald-500" />

      {/* Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center justify-center shrink-0">
            <Table className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
              {data.label || 'Output Inspector'}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">Result inspection & export sink</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
          Sink
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-center">
          {hasOutput ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Data captured and ready
              </div>
              <p className="text-[11px] text-slate-400">
                Inspect rows, JSON tree, and export CSV in bottom panel
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Connect to upstream nodes to inspect, preview, and export results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
