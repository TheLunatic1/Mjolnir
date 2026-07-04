import React from 'react';
import { useStore } from '../../store';
import { RequestNode } from './RequestNode';
import { ScenarioConfig } from './ScenarioConfig';
import { Button } from '../shared/Button';
import type { RequestSpec } from '../../types';
import { Plus, Sliders, Layers, FileCode2 } from 'lucide-react';

export const BuilderPage: React.FC = () => {
  const { activeScenario, setActiveScenario, setActiveTab } = useStore();

  const addRequest = () => {
    const newReq: RequestSpec = {
      id: `req_${Date.now()}`,
      name: `New Request #${activeScenario.requests.length + 1}`,
      protocol: 'http2',
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: [{ key: 'Accept', value: 'application/json' }],
      queryParams: [],
      cookies: [],
      bodyType: 'none',
      auth: { type: 'none' },
      timeoutMs: 10000,
    };
    setActiveScenario((prev) => ({
      ...prev,
      requests: [...prev.requests, newReq],
    }));
  };

  const updateRequest = (idx: number, updated: RequestSpec) => {
    const next = [...activeScenario.requests];
    next[idx] = updated;
    setActiveScenario((prev) => ({ ...prev, requests: next }));
  };

  const deleteRequest = (idx: number) => {
    setActiveScenario((prev) => ({
      ...prev,
      requests: prev.requests.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Scenario Orchestration</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight flex items-center gap-2">
            Visual Drag-and-Drop Workflow Builder
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setActiveTab('editor')} icon={<FileCode2 className="w-4 h-4 text-violet-400" />}>
            Switch to Code Mode
          </Button>
          <Button variant="primary" size="md" onClick={addRequest} icon={<Plus className="w-4 h-4" />}>
            Add Request Step
          </Button>
        </div>
      </div>

      {/* Scenario Execution Topology Config */}
      <ScenarioConfig />

      {/* Sequence Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit',sans-serif]">
              Request Execution Pipeline ({activeScenario.requests.length} Steps)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Executed sequentially per Virtual User loop</span>
        </div>

        {activeScenario.requests.length === 0 ? (
          <div className="glass-card p-12 rounded-xl border border-slate-800 text-center space-y-3">
            <Sliders className="w-10 h-10 text-slate-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-slate-300">No requests defined in this pipeline</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the "Add Request Step" button above to start chaining HTTP/1.1, HTTP/2, WebSockets, or gRPC endpoints.
            </p>
            <Button variant="primary" size="sm" onClick={addRequest} icon={<Plus className="w-3.5 h-3.5" />}>
              Add First Step
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeScenario.requests.map((req, idx) => (
              <RequestNode
                key={req.id}
                request={req}
                index={idx}
                onUpdate={(updated) => updateRequest(idx, updated)}
                onDelete={() => deleteRequest(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
