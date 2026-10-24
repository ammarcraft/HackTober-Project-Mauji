import React, { useState, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useWorkflowStore } from './store/workflowStore';
import { TopBar } from './components/TopBar';
import { SidebarLeft } from './components/SidebarLeft';
import { Canvas } from './components/Canvas';
import { NodeConfigPanel } from './components/NodeConfigPanel';
import { BottomPanel } from './components/BottomPanel';
import { SettingsModal } from './components/modals/SettingsModal';
import { ExecutionHistoryModal } from './components/modals/ExecutionHistoryModal';
import { api } from './services/api';

export function AppContent() {
  const store = useWorkflowStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = store.nodes.find((n) => n.id === store.selectedNodeId) || null;

  // Export Workflow as JSON
  const handleExportWorkflow = () => {
    const data = {
      name: store.workflowName,
      graph: {
        nodes: store.nodes,
        edges: store.edges,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.workflowName.toLowerCase().replace(/\s+/g, '_')}_workflow.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Workflow from JSON
  const handleImportWorkflow = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.graph && json.graph.nodes) {
          store.setNodes(json.graph.nodes);
          store.setEdges(json.graph.edges || []);
          if (json.name) store.setWorkflowName(json.name);
        } else if (Array.isArray(json.nodes)) {
          store.setNodes(json.nodes);
          store.setEdges(json.edges || []);
          if (json.name) store.setWorkflowName(json.name);
        }
      } catch (err) {
        alert('Failed to parse workflow JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden file input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <TopBar
        workflowName={store.workflowName}
        onWorkflowNameChange={store.setWorkflowName}
        saveStatus={store.saveStatus}
        onSave={store.saveWorkflow}
        isExecuting={store.isExecuting}
        onRunWorkflow={store.executeWorkflow}
        onStopWorkflow={store.stopExecution}
        selectedNodeId={store.selectedNodeId}
        onTestNode={store.testNode}
        settings={store.settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLoadTemplate={store.loadTemplate}
        onExportWorkflow={handleExportWorkflow}
        onImportWorkflow={handleImportWorkflow}
      />

      {/* Main Workspace: Left Sidebar + Center Canvas + Right Config Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar: Node Library & Templates */}
        <SidebarLeft
          onAddNode={store.addNode}
          onLoadTemplate={store.loadTemplate}
        />

        {/* Center: React Flow Canvas */}
        <main className="flex-1 h-full relative">
          <Canvas
            nodes={store.nodes}
            edges={store.edges}
            onNodesChange={store.onNodesChange}
            onEdgesChange={store.onEdgesChange}
            onConnect={store.onConnect}
            selectedNodeId={store.selectedNodeId}
            onSelectNode={store.setSelectedNodeId}
            onAddNode={store.addNode}
          />
        </main>

        {/* Right Sidebar: Selected Node Configuration */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            nodes={store.nodes}
            edges={store.edges}
            executionResults={store.executionResults}
            onClose={() => store.setSelectedNodeId(null)}
            onUpdate={(partial) => store.updateNodeData(selectedNode.id, partial)}
            onDuplicate={store.duplicateNode}
            onDelete={store.deleteNode}
            onTestNode={store.testNode}
          />
        )}
      </div>

      {/* Bottom Collapsible Execution & Inspector Panel */}
      <BottomPanel
        isOpen={store.isBottomPanelOpen}
        onToggle={() => store.setIsBottomPanelOpen(!store.isBottomPanelOpen)}
        activeTab={store.bottomPanelTab}
        onTabChange={store.setBottomPanelTab}
        nodes={store.nodes}
        selectedNodeId={store.selectedInspectorNodeId || store.selectedNodeId}
        onSelectNode={store.setSelectedInspectorNodeId}
        executionResults={store.executionResults}
        logs={store.executionLogs}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={store.settings}
        onSave={async (newSettings) => {
          store.setSettings(newSettings);
          await api.updateSettings(newSettings);
        }}
      />

      {/* Execution History Modal */}
      <ExecutionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        workflowId={store.workflowId}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}
