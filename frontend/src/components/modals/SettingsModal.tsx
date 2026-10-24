import React, { useState } from 'react';
import { X, Key, Server, Cpu, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { ProviderSettings } from '../../types/workflow';
import { api } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSave: (newSettings: ProviderSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(settings.api_key || '');
  const [baseUrl, setBaseUrl] = useState(settings.base_url || 'https://models.jarvislabs.net/v1');
  const [model, setModel] = useState(settings.model || 'deepseek-v4-flash-0731');
  const [isMock, setIsMock] = useState(settings.is_mock);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency_ms?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection({
        api_key: apiKey,
        base_url: baseUrl,
        model,
        is_mock: isMock,
      });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      api_key: apiKey,
      base_url: baseUrl,
      model,
      is_mock: isMock,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/50 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Provider Settings</h3>
              <p className="text-xs text-slate-400">Configure Jarvis Labs or Mock inference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Mode Switch Card */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Execution Provider Engine</span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  isMock
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                }`}
              >
                {isMock ? 'Mock Mode' : 'Live Jarvis Labs'}
              </span>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={isMock}
                onChange={(e) => setIsMock(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900 mt-0.5"
              />
              <div className="text-slate-400 text-[11px] leading-relaxed">
                <span className="text-slate-200 font-medium block">
                  Enable Mock AI Provider (Zero API key required)
                </span>
                Generates realistic, schema-valid synthetic responses based on your exact prompt instructions and row count requirements.
              </div>
            </label>
          </div>

          {/* Jarvis Labs API Key */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Jarvis Labs API Key</span>
            </label>
            <input
              type="password"
              placeholder="e.g. jv_live_xxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Credentials are securely stored on backend and never exposed in browser code.
            </p>
          </div>

          {/* Endpoint Base URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>API Base URL</span>
            </label>
            <input
              type="text"
              placeholder="https://models.jarvislabs.net/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Default Model */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Default AI Model</span>
            </label>
            <input
              type="text"
              placeholder="deepseek-v4-flash-0731"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="text-[11px]">
                <div className="font-medium">{testResult.message}</div>
                {testResult.latency_ms !== undefined && (
                  <div className="text-slate-400 mt-0.5">Latency: {testResult.latency_ms}ms</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/80 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
