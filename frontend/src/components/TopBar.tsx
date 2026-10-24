import React, { useState } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Settings,
  History,
  Save,
  Check,
  FolderOpen,
  Download,
  Upload,
  BrainCircuit,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { ProviderSettings } from '../types/workflow';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../services/templates';

interface TopBarProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onSave: () => void;
  isExecuting: boolean;
  onRunWorkflow: () => void;
  onStopWorkflow: () => void;
  selectedNodeId: string | null;
  onTestNode: (id: string) => void;
  settings: ProviderSettings;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  onExportWorkflow: () => void;
  onImportWorkflow: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  workflowName,
  onWorkflowNameChange,
  saveStatus,
  onSave,
  isExecuting,
  onRunWorkflow,
  onStopWorkflow,
  selectedNodeId,
  onTestNode,
  settings,
  onOpenSettings,
  onOpenHistory,
  onLoadTemplate,
  onExportWorkflow,
  onImportWorkflow,
}) => {
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0 text-slate-100 shadow-md">
      {/* Left: Brand & Workflow Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            AIFlow <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800 px-1.5 py-0.5 rounded ml-1 font-mono">mini n8n</span>
          </span>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 mx-1" />

        {/* Inline Editable Workflow Name */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => onWorkflowNameChange(e.target.value)}
            className="bg-transparent font-semibold text-sm text-slate-100 focus:outline-none focus:bg-slate-800/80 rounded px-2 py-1 border border-transparent hover:border-slate-800 focus:border-indigo-500 transition-all max-w-xs truncate"
            title="Click to rename workflow"
          />

          {/* Save Status Badge */}
          <span
            onClick={onSave}
            className={`cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
              saveStatus === 'saved'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                : saveStatus === 'saving'
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40 animate-pulse'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
            }`}
          >
            {saveStatus === 'saved' ? (
              <>
                <Check className="w-2.5 h-2.5" />
                Saved
              </>
            ) : saveStatus === 'saving' ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-2.5 h-2.5" />
                Save Changes
              </>
            )}
          </span>
        </div>
      </div>

      {/* Center: Templates Dropdown & Workflow Actions */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Templates</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showTemplatesDropdown && (
            <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1.5 z-50">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Pre-built AI Pipeline
              </div>
              {WORKFLOW_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    onLoadTemplate(tpl);
                    setShowTemplatesDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{tpl.name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{tpl.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onExportWorkflow}
          title="Export Workflow JSON"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onImportWorkflow}
          title="Import Workflow JSON"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <Upload className="w-4 h-4" />
        </button>
      </div>

      {/* Right: API Settings, History, Run Actions */}
      <div className="flex items-center gap-2.5">
        {/* Provider Mode Pill / Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              settings.is_mock ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
            }`}
          />
          <span>{settings.is_mock ? 'Mock Engine' : 'Jarvis Labs'}</span>
          <Settings className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>

        {/* Execution History */}
        <button
          type="button"
          onClick={onOpenHistory}
          title="Execution History"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Test Selected Node */}
        {selectedNodeId && (
          <button
            type="button"
            onClick={() => onTestNode(selectedNodeId)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Test Node</span>
          </button>
        )}

        {/* Run / Stop Workflow Main Button */}
        {isExecuting ? (
          <button
            type="button"
            onClick={onStopWorkflow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 px-4 py-1.5 rounded-md shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Execution</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRunWorkflow}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-1.5 rounded-md shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Workflow</span>
          </button>
        )}
      </div>
    </header>
  );
};
