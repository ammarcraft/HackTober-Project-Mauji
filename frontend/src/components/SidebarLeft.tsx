import React, { useState } from 'react';
import {
  BrainCircuit,
  PlayCircle,
  Table,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
} from 'lucide-react';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../services/templates';

interface SidebarLeftProps {
  onAddNode: (type: string, position?: { x: number; y: number }) => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ onAddNode, onLoadTemplate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const nodeLibrary = [
    {
      type: 'universalAi',
      label: 'Universal AI Node',
      desc: 'Configurable AI execution unit with custom prompt, schema & row count',
      icon: BrainCircuit,
      color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800/60',
    },
    {
      type: 'workflowInput',
      label: 'Workflow Input',
      desc: 'Define initial parameters passed to downstream nodes',
      icon: PlayCircle,
      color: 'text-sky-400 bg-sky-950/80 border-sky-800/60',
    },
    {
      type: 'outputViewer',
      label: 'Output Inspector',
      desc: 'Table viewer, JSON inspector & CSV export sink',
      icon: Table,
      color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60',
    },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 z-10 shrink-0 text-slate-400">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white"
          title="Expand Node Library"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-4 flex flex-col gap-3">
          {nodeLibrary.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => onAddNode(item.type)}
                title={item.label}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0 text-slate-100 shadow-xl select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Node Library
        </span>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Draggable Node Cards */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        <div className="text-[11px] text-slate-400 px-1">
          Drag onto the canvas or click '+' to add:
        </div>

        {nodeLibrary.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-xl cursor-grab active:cursor-grabbing transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {item.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onAddNode(item.type)}
                  title="Add to canvas"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-300 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-9">
                {item.desc}
              </p>
            </div>
          );
        })}

        {/* Templates quick launcher */}
        <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
            Example AI Workflows
          </div>
          {WORKFLOW_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onLoadTemplate(tpl)}
              className="w-full text-left p-2.5 bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/60 rounded-lg transition-colors flex items-start gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-300">{tpl.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{tpl.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
