import { WorkflowItem, ProviderSettings, ExecutionRecord } from '../types/workflow';

const BASE_URL = '/api';

export const api = {
  async getWorkflows(): Promise<WorkflowItem[]> {
    const res = await fetch(`${BASE_URL}/workflows`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  async getWorkflow(id: string): Promise<WorkflowItem> {
    const res = await fetch(`${BASE_URL}/workflows/${id}`);
    if (!res.ok) throw new Error('Failed to fetch workflow');
    return res.json();
  },

  async createWorkflow(payload: { name: string; description?: string; graph_data: any }): Promise<WorkflowItem> {
    const res = await fetch(`${BASE_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create workflow');
    return res.json();
  },

  async updateWorkflow(id: string, payload: { name?: string; description?: string; graph_data?: any }): Promise<WorkflowItem> {
    const res = await fetch(`${BASE_URL}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update workflow');
    return res.json();
  },

  async deleteWorkflow(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/workflows/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete workflow');
  },

  async testNode(payload: {
    node_id: string;
    node_data: any;
    upstream_data?: any;
    workflow_inputs?: any;
    provider_settings?: any;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/nodes/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to test node');
    return res.json();
  },

  async previewPrompt(payload: {
    user_prompt: string;
    system_prompt?: string;
    upstream_data?: any;
    workflow_inputs?: any;
    node_labels?: any;
    direct_parents?: string[];
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/nodes/preview-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to preview prompt');
    return res.json();
  },

  async getSettings(): Promise<ProviderSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(payload: Partial<ProviderSettings>): Promise<ProviderSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async testConnection(payload: Partial<ProviderSettings>): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Connection test failed');
    return res.json();
  },

  async getExecutions(workflowId?: string): Promise<ExecutionRecord[]> {
    const url = workflowId ? `${BASE_URL}/executions?workflow_id=${workflowId}` : `${BASE_URL}/executions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch executions');
    return res.json();
  },

  executeWorkflowStream(
    workflowId: string,
    params: { inputs?: any; provider_settings?: any },
    onEvent: (event: any) => void,
    onError: (err: any) => void,
    onFinish: () => void
  ) {
    const controller = new AbortController();

    fetch(`${BASE_URL}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Execution request failed: HTTP ${response.status}`);
        }
        if (!response.body) {
          throw new Error('No readable stream available in response.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              try {
                const dataJson = JSON.parse(trimmed.slice(5).trim());
                onEvent(dataJson);
              } catch (e) {
                console.error('Error parsing SSE event data:', e);
              }
            }
          }
        }
        onFinish();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err);
        }
        onFinish();
      });

    return () => controller.abort();
  },
};
