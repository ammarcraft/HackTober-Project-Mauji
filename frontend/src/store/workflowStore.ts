import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  UniversalNodeData,
  ProviderSettings,
  ExecutionLogEntry,
  NodeExecutionStatus,
} from '../types/workflow';
import { api } from '../services/api';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../services/templates';

export function useWorkflowStore() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState<string>('Skincare Brand Product & Campaign Engine');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // React Flow state
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Selection & UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedInspectorNodeId, setSelectedInspectorNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
  const [bottomPanelTab, setBottomPanelTab] = useState<'results' | 'logs' | 'prompts' | 'errors' | 'reasoning'>('results');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);

  // Settings
  const [settings, setSettings] = useState<ProviderSettings>({
    api_key: '',
    base_url: 'https://models.jarvislabs.net/v1',
    model: 'deepseek-v4-flash-0731',
    is_mock: true,
  });

  const abortControllerRef = useRef<(() => void) | null>(null);

  // Load initial settings and default template on mount
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
    // Load default template
    const defaultTpl = WORKFLOW_TEMPLATES[0];
    setWorkflowName(defaultTpl.name);
    setNodes(defaultTpl.graph.nodes);
    setEdges(defaultTpl.graph.edges);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      setSaveStatus('unsaved');
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      setSaveStatus('unsaved');
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: false }, eds));
      setSaveStatus('unsaved');
    },
    []
  );

  const updateNodeData = useCallback(
    (nodeId: string, partialData: Partial<UniversalNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                ...partialData,
              },
            };
          }
          return n;
        })
      );
      setSaveStatus('unsaved');
    },
    []
  );

  const addNode = useCallback(
    (type: string, position = { x: 250, y: 250 }) => {
      const id = `node_${Date.now()}`;
      let initialData: UniversalNodeData;

      if (type === 'workflowInput') {
        initialData = {
          label: 'Workflow Input',
          description: 'Global parameters for downstream nodes',
          enabled: true,
          user_prompt: '',
          output_mode: 'auto',
          row_mode: 'single',
          row_count: 1,
          enforce_uniqueness: false,
          input_fields: {
            topic: 'Innovative AI automation',
            audience: 'Growth engineering teams',
          },
        };
      } else if (type === 'outputViewer') {
        initialData = {
          label: 'Output Inspector',
          description: 'Inspect and export structured outputs',
          enabled: true,
          user_prompt: '',
          output_mode: 'auto',
          row_mode: 'single',
          row_count: 1,
          enforce_uniqueness: false,
        };
      } else {
        // Universal AI Node
        initialData = {
          label: 'Custom AI Node',
          description: 'Universal configurable AI execution node',
          model: settings.model || 'deepseek-v4-flash-0731',
          enabled: true,
          system_prompt: 'You are a precise, structured AI workflow assistant.',
          user_prompt: 'Analyze the incoming input data and perform the specified transformation.',
          output_mode: 'auto',
          row_mode: 'single',
          row_count: 1,
          enforce_uniqueness: false,
          reasoning_effort: 'high',
          max_tokens: 16384,
          schema_fields: [
            { name: 'summary', type: 'string', required: true, description: 'Executive summary' },
            { name: 'insights', type: 'array', required: true, items_type: 'string', description: 'Key insights' },
          ],
          json_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              insights: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'insights'],
          },
        };
      }

      const newNode: Node = {
        id,
        type,
        position,
        data: initialData,
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
      setSaveStatus('unsaved');
    },
    [settings.model]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const source = nodes.find((n) => n.id === nodeId);
      if (!source) return;

      const newId = `node_${Date.now()}`;
      const duplicated: Node = {
        ...source,
        id: newId,
        position: {
          x: source.position.x + 40,
          y: source.position.y + 40,
        },
        data: {
          ...source.data,
          label: `${source.data.label || 'Node'} (Copy)`,
          executionStatus: 'idle',
          executionOutput: undefined,
          executionMeta: undefined,
        },
      };

      setNodes((nds) => [...nds, duplicated]);
      setSelectedNodeId(newId);
      setSaveStatus('unsaved');
    },
    [nodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (selectedInspectorNodeId === nodeId) setSelectedInspectorNodeId(null);
      setSaveStatus('unsaved');
    },
    [selectedNodeId, selectedInspectorNodeId]
  );

  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    setWorkflowName(template.name);
    setNodes(template.graph.nodes);
    setEdges(template.graph.edges);
    setSelectedNodeId(null);
    setExecutionLogs([]);
    setExecutionResults({});
    setSaveStatus('unsaved');
  }, []);

  const saveWorkflow = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const payload = {
        name: workflowName,
        graph_data: { nodes, edges },
      };
      if (workflowId) {
        await api.updateWorkflow(workflowId, payload);
      } else {
        const created = await api.createWorkflow(payload);
        setWorkflowId(created.id);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('unsaved');
    }
  }, [workflowId, workflowName, nodes, edges]);

  // Execute full workflow
  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;

    // Save first if needed to ensure backend has latest graph
    let currentWfId = workflowId;
    setSaveStatus('saving');
    try {
      const payload = {
        name: workflowName,
        graph_data: { nodes, edges },
      };
      if (currentWfId) {
        await api.updateWorkflow(currentWfId, payload);
      } else {
        const created = await api.createWorkflow(payload);
        currentWfId = created.id;
        setWorkflowId(created.id);
      }
      setSaveStatus('saved');
    } catch (e) {
      console.error('Failed saving before execute:', e);
    }

    if (!currentWfId) return;

    setIsExecuting(true);
    setIsBottomPanelOpen(true);
    setBottomPanelTab('logs');
    setExecutionLogs([]);
    const resultsAcc: Record<string, any> = {};

    // Reset node execution statuses to idle
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          executionStatus: 'idle',
        },
      }))
    );

    // Extract inputs from input nodes if any
    const inputNode = nodes.find((n) => n.type === 'workflowInput');
    const workflowInputs = inputNode?.data?.input_fields || {};

    const abortFn = api.executeWorkflowStream(
      currentWfId,
      {
        inputs: workflowInputs,
        provider_settings: settings,
      },
      (event: any) => {
        const eventType = event.type;
        const now = new Date().toISOString();

        if (eventType === 'workflow_started') {
          setExecutionLogs((prev) => [
            ...prev,
            { timestamp: now, level: 'info', message: 'Workflow execution initialized.' },
          ]);
        } else if (eventType === 'node_started') {
          const nid = event.node_id;
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nid
                ? { ...n, data: { ...n.data, executionStatus: 'running' } }
                : n
            )
          );
          setExecutionLogs((prev) => [
            ...prev,
            { timestamp: now, level: 'info', node_id: nid, message: `Node '${nid}' execution started.` },
          ]);
        } else if (eventType === 'node_completed') {
          const nid = event.node_id;
          resultsAcc[nid] = event.output;
          setExecutionResults({ ...resultsAcc });
          setSelectedInspectorNodeId(nid);

          setNodes((nds) =>
            nds.map((n) =>
              n.id === nid
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      executionStatus: 'success',
                      executionOutput: event.output,
                      executionMeta: event.meta,
                    },
                  }
                : n
            )
          );
          setExecutionLogs((prev) => [
            ...prev,
            {
              timestamp: now,
              level: 'info',
              node_id: nid,
              message: `Node '${nid}' completed in ${event.meta?.duration_ms || 0}ms.`,
              data: event.meta,
            },
          ]);
        } else if (eventType === 'node_failed') {
          const nid = event.node_id;
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nid
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      executionStatus: 'failed',
                      executionMeta: { ...event.meta, error: event.error },
                    },
                  }
                : n
            )
          );
          setExecutionLogs((prev) => [
            ...prev,
            {
              timestamp: now,
              level: 'error',
              node_id: nid,
              message: `Node '${nid}' failed: ${event.error}`,
              data: event.meta,
            },
          ]);
          setBottomPanelTab('errors');
        } else if (eventType === 'workflow_completed') {
          setExecutionLogs((prev) => [
            ...prev,
            {
              timestamp: now,
              level: 'info',
              message: `Workflow completed successfully in ${event.duration_ms}ms!`,
            },
          ]);
          setBottomPanelTab('results');
        } else if (eventType === 'workflow_failed') {
          setExecutionLogs((prev) => [
            ...prev,
            {
              timestamp: now,
              level: 'error',
              message: `Workflow failed: ${event.error}`,
            },
          ]);
          setBottomPanelTab('errors');
        }
      },
      (err: any) => {
        setExecutionLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Stream error: ${err.message}`,
          },
        ]);
        setIsExecuting(false);
      },
      () => {
        setIsExecuting(false);
        abortControllerRef.current = null;
      }
    );

    abortControllerRef.current = abortFn;
  }, [workflowId, workflowName, nodes, edges, isExecuting, settings]);

  const stopExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
    setExecutionLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        level: 'warning',
        message: 'Workflow execution cancelled by user.',
      },
    ]);
  }, []);

  // Test single node
  const testNode = useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Set node to running
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, executionStatus: 'running' } } : n
        )
      );
      setIsBottomPanelOpen(true);
      setBottomPanelTab('results');
      setSelectedInspectorNodeId(nodeId);

      const inputNode = nodes.find((n) => n.type === 'workflowInput');
      const workflowInputs = inputNode?.data?.input_fields || {};

      try {
        const res = await api.testNode({
          node_id: nodeId,
          node_data: node.data,
          upstream_data: executionResults,
          workflow_inputs: workflowInputs,
          provider_settings: settings,
        });

        if (res.success) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      executionStatus: 'success',
                      executionOutput: res.output,
                      executionMeta: {
                        duration_ms: res.duration_ms,
                        is_mock: res.is_mock,
                        resolved_prompt: res.resolved_prompt,
                        resolved_system_prompt: res.resolved_system_prompt,
                        row_meta: res.row_count_meta,
                        raw_content: res.raw_response,
                      },
                    },
                  }
                : n
            )
          );
          setExecutionResults((prev) => ({ ...prev, [nodeId]: res.output }));
          setExecutionLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              level: 'info',
              node_id: nodeId,
              message: `Single node test '${node.data.label}' succeeded in ${res.duration_ms}ms.`,
            },
          ]);
        } else {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      executionStatus: 'failed',
                      executionMeta: {
                        duration_ms: res.duration_ms,
                        is_mock: res.is_mock,
                        error: res.error,
                      },
                    },
                  }
                : n
            )
          );
          setExecutionLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              level: 'error',
              node_id: nodeId,
              message: `Single node test '${node.data.label}' failed: ${res.error}`,
            },
          ]);
          setBottomPanelTab('errors');
        }
      } catch (err: any) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    executionStatus: 'failed',
                    executionMeta: { error: err.message },
                  },
                }
              : n
          )
        );
      }
    },
    [nodes, executionResults]
  );

  return {
    workflowId,
    workflowName,
    saveStatus,
    nodes,
    edges,
    selectedNodeId,
    selectedInspectorNodeId,
    isExecuting,
    executionLogs,
    executionResults,
    bottomPanelTab,
    isBottomPanelOpen,
    settings,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    setSelectedInspectorNodeId,
    setBottomPanelTab,
    setIsBottomPanelOpen,
    setWorkflowName,
    setSettings,
    updateNodeData,
    addNode,
    duplicateNode,
    deleteNode,
    loadTemplate,
    saveWorkflow,
    executeWorkflow,
    stopExecution,
    testNode,
  };
}
