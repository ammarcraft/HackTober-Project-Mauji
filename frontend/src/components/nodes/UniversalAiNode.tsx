import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  BrainCircuit,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Rows,
  FileJson,
  FileText,
  Sliders,
} from 'lucide-react';
import { UniversalNodeData } from '../../types/workflow';

interface UniversalAiNodeProps {
  id: string;
  data: UniversalNodeData;
  selected: boolean;
}

export const UniversalAiNode: React.FC<UniversalAiNodeProps> = ({ id, data, selected }) => {
  const status = data.executionStatus || 'idle';
  const meta = data.executionMeta;

  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  const isDisabled = !data.enabled;

  const getBorderColor = () => {
    if (isRunning) return 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]';
    if (isFailed) return 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
    if (isSuccess) return 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    if (selected) return 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.25)]';
    return 'border-slate-800 hover:border-slate-700';
  };

  return (
    <div
      className={`relative w-80 rounded-xl bg-slate-900/95 backdrop-blur-md border ${getBorderColor()} transition-all duration-200 text-slate-100 shadow-xl overflow-hidden group`}
    >
      {/* Target input handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />

      {/* Top status bar accent */}
      <div
        className={`h-1 w-full ${
          isRunning
            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse'
            : isFailed
            ? 'bg-rose-500'
            : isSuccess
            ? 'bg-emerald-500'
            : selected
            ? 'bg-indigo-500'
            : 'bg-slate-800'
        }`}
      />

      {/* Node Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isRunning
                ? 'bg-indigo-500/20 text-indigo-400 animate-spin'
                : isSuccess
                ? 'bg-emerald-500/20 text-emerald-400'
                : isFailed
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/40'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
              {data.label || 'Custom AI Node'}
            </h3>
            <p className="text-[11px] text-slate-400 truncate font-mono">
              {data.model === 'deepseek-v4-flash-0731'
                ? 'DeepSeek V4 Flash'
                : data.model
                ? data.model.split('/').pop()
                : 'DeepSeek V4 Flash'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1 shrink-0">
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded-full animate-pulse">
              <Clock className="w-2.5 h-2.5" />
              Running...
            </span>
          )}
          {isSuccess && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" />
              {meta?.duration_ms ? `${meta.duration_ms}ms` : 'Success'}
            </span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-rose-300 bg-rose-950/80 border border-rose-700/60 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-2.5 h-2.5" />
              Failed
            </span>
          )}
          {isDisabled && (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              Disabled
            </span>
          )}
        </div>
      </div>

      {/* Node Body */}
      <div className="p-3.5 space-y-2.5">
        {/* User Prompt Preview */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Custom Prompt</span>
            <span className="text-[9px] text-slate-400 font-normal">
              {data.user_prompt?.length || 0} chars
            </span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 italic font-mono leading-relaxed">
            {data.user_prompt || 'No prompt configured yet. Click to configure instructions.'}
          </p>
        </div>

        {/* Configuration Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Output Mode Pill */}
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
            {data.output_mode === 'structured_json' && <FileJson className="w-3 h-3 text-cyan-400" />}
            {data.output_mode === 'raw_text' && <FileText className="w-3 h-3 text-amber-400" />}
            {data.output_mode === 'auto' && <Sparkles className="w-3 h-3 text-purple-400" />}
            <span className="capitalize">{data.output_mode.replace('_', ' ')}</span>
          </span>

          {/* Row Count Pill */}
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
            <Rows className="w-3 h-3 text-emerald-400" />
            {data.row_mode === 'multiple' ? `${data.row_count || 1} Rows` : 'Single Output'}
          </span>

          {/* Reasoning Effort Pill */}
          {data.reasoning_effort && data.reasoning_effort !== 'off' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-md border border-purple-800/50">
              🧠 {data.reasoning_effort}
            </span>
          )}

          {/* Schema Fields Count if JSON */}
          {data.output_mode === 'structured_json' && (
            <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/40">
              {data.schema_fields?.length || 0} fields
            </span>
          )}
        </div>

        {/* Execution Result Summary if executed */}
        {data.executionOutput && (
          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {meta?.row_meta
                ? `${meta.row_meta.valid}/${meta.row_meta.requested} valid records`
                : typeof data.executionOutput === 'object'
                ? 'Structured object ready'
                : 'Output generated'}
            </span>
            <span className="text-[10px] text-slate-400">
              {meta?.is_mock ? 'Mock Engine' : 'Jarvis Labs'}
            </span>
          </div>
        )}
      </div>

      {/* Source output handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
    </div>
  );
};
