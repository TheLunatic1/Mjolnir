import React from 'react';
import { useStore } from '../../store';
import type { ExecutionProfileType } from '../../types';
import { Button } from '../shared/Button';
import { Plus, Trash2, Database, ShieldCheck, Sliders } from 'lucide-react';

export const ScenarioConfig: React.FC = () => {
  const { activeScenario, setActiveScenario } = useStore();
  const exec = activeScenario.execution;

  const updateProfile = (profile: ExecutionProfileType) => {
    setActiveScenario((prev) => ({
      ...prev,
      execution: { ...prev.execution, profile },
    }));
  };

  const addStage = () => {
    const stages = exec.stages || [];
    setActiveScenario((prev) => ({
      ...prev,
      execution: {
        ...prev.execution,
        stages: [...stages, { durationSeconds: 30, targetVUs: 100 }],
      },
    }));
  };

  const updateStage = (idx: number, field: 'durationSeconds' | 'targetVUs', val: number) => {
    const stages = [...(exec.stages || [])];
    stages[idx] = { ...stages[idx], [field]: val };
    setActiveScenario((prev) => ({
      ...prev,
      execution: { ...prev.execution, stages },
    }));
  };

  const removeStage = (idx: number) => {
    setActiveScenario((prev) => ({
      ...prev,
      execution: {
        ...prev.execution,
        stages: (prev.execution.stages || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const addThreshold = () => {
    setActiveScenario((prev) => ({
      ...prev,
      thresholds: [
        ...prev.thresholds,
        { metric: 'http_req_duration', aggregation: 'p95', operator: '<', value: 300, abortOnFail: false },
      ],
    }));
  };

  return (
    <div className="space-y-6 select-none">
      {/* Execution Profile Card */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-primary-500" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Simulation Execution Topology</h3>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {([
            { id: 'constant_vu', label: 'Constant VUs' },
            { id: 'ramping_vu', label: 'Ramping Stages' },
            { id: 'constant_arrival_rate', label: 'Constant RPS' },
            { id: 'spike', label: 'Spike Strike' },
            { id: 'soak', label: 'Soak Test' },
          ] as const).map((p) => (
            <button
              key={p.id}
              onClick={() => updateProfile(p.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                exec.profile === p.id
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-slate-950 shadow-glow-cyan'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Profile specific form fields */}
        {exec.profile === 'constant_vu' && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Concurrent Virtual Users</label>
              <input
                type="number"
                value={exec.vus || 10}
                onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, vus: Number(e.target.value) } }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Duration (seconds)</label>
              <input
                type="number"
                value={exec.durationSeconds || 30}
                onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, durationSeconds: Number(e.target.value) } }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
              />
            </div>
          </div>
        )}

        {exec.profile === 'ramping_vu' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Ramping Stages ({exec.stages?.length || 0})</span>
              <Button variant="secondary" size="sm" onClick={addStage} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Stage
              </Button>
            </div>
            {(exec.stages || []).map((stg, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-slate-500 font-mono">Stage #{idx + 1}</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Duration (s):</span>
                  <input
                    type="number"
                    value={stg.durationSeconds}
                    onChange={(e) => updateStage(idx, 'durationSeconds', Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Target VUs:</span>
                  <input
                    type="number"
                    value={stg.targetVUs || 0}
                    onChange={(e) => updateStage(idx, 'targetVUs', Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-400 font-bold"
                  />
                </div>
                <button onClick={() => removeStage(idx)} className="p-1 text-slate-500 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {exec.profile === 'constant_arrival_rate' && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Target Rate (RPS)</label>
              <input type="number" value={exec.targetRps || 100} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, targetRps: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Duration (s)</label>
              <input type="number" value={exec.durationSeconds || 30} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, durationSeconds: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Max Concurrency VUs</label>
              <input type="number" value={exec.maxVUs || 500} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, maxVUs: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400" />
            </div>
          </div>
        )}

        {exec.profile === 'spike' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Base VUs (Normal)</label>
              <input type="number" value={exec.vus || 10} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, vus: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Spike Peak VUs</label>
              <input type="number" value={exec.maxVUs || 500} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, maxVUs: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-rose-400 font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Warmup Duration (s)</label>
              <input type="number" value={exec.durationSeconds || 30} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, durationSeconds: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Spike Duration (s)</label>
              <input type="number" value={exec.targetRps || 10} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, targetRps: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-400" />
              <p className="text-[10px] text-slate-500 mt-0.5">How long to hold the spike</p>
            </div>
          </div>
        )}

        {exec.profile === 'soak' && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Concurrent VUs</label>
              <input type="number" value={exec.vus || 20} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, vus: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Duration (seconds)</label>
              <input type="number" value={exec.durationSeconds || 3600} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, durationSeconds: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200" />
              <p className="text-[10px] text-slate-500 mt-0.5">Default: 3600s (1 hour)</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Think Time (ms between loops)</label>
              <input type="number" value={exec.targetRps || 1000} onChange={(e) => setActiveScenario((p) => ({ ...p, execution: { ...p.execution, targetRps: Number(e.target.value) } }))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-violet-400" />
            </div>
          </div>
        )}
      </div>

      {/* CSV Parameter Looping & SLA Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">CSV Parameter Ingestion</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Enable high-speed CSV looping</span>
            <input
              type="checkbox"
              checked={activeScenario.csv.enabled}
              onChange={(e) => setActiveScenario((p) => ({ ...p, csv: { ...p.csv, enabled: e.target.checked } }))}
              className="w-4 h-4 accent-primary-500 rounded"
            />
          </div>
          {activeScenario.csv.enabled && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeScenario.csv.filePath || ''}
                  placeholder="/path/to/credentials.csv"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-200"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (window.mjolnir) {
                      const file = await window.mjolnir.dialog.openFile([{ name: 'CSV Files', extensions: ['csv'] }]);
                      if (file) {
                        setActiveScenario((p) => ({ ...p, csv: { ...p.csv, filePath: file } }));
                      }
                    }
                  }}
                >
                  Browse
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* SLA Rules Panel */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">SLA Assertions</h3>
            </div>
            <Button variant="secondary" size="sm" onClick={addThreshold} icon={<Plus className="w-3.5 h-3.5" />}>
              Add SLA Rule
            </Button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {activeScenario.thresholds.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-mono bg-slate-900/60 p-2 rounded border border-slate-800 flex-wrap">
                <select
                  value={rule.metric}
                  onChange={(e) => setActiveScenario((p) => { const t = [...p.thresholds]; t[idx] = { ...t[idx], metric: e.target.value as any }; return { ...p, thresholds: t }; })}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-cyan-400 text-[10px]"
                >
                  {['http_req_duration','http_req_failed','http_req_succeeded','ttfb','dns','tcp','tls','rps','bandwidth'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={rule.aggregation}
                  onChange={(e) => setActiveScenario((p) => { const t = [...p.thresholds]; t[idx] = { ...t[idx], aggregation: e.target.value as any }; return { ...p, thresholds: t }; })}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-violet-400 text-[10px]"
                >
                  {['p50','p90','p95','p99','p999','avg','max','rate','count'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select
                  value={rule.operator}
                  onChange={(e) => setActiveScenario((p) => { const t = [...p.thresholds]; t[idx] = { ...t[idx], operator: e.target.value as any }; return { ...p, thresholds: t }; })}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-amber-400 text-[10px]"
                >
                  {['<','<=','>','>=','=='].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => setActiveScenario((p) => { const t = [...p.thresholds]; t[idx] = { ...t[idx], value: Number(e.target.value) }; return { ...p, thresholds: t }; })}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-emerald-400 font-bold text-[10px]"
                />
                <label className="flex items-center gap-1 text-slate-500 text-[10px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.abortOnFail ?? false}
                    onChange={(e) => setActiveScenario((p) => { const t = [...p.thresholds]; t[idx] = { ...t[idx], abortOnFail: e.target.checked }; return { ...p, thresholds: t }; })}
                    className="accent-rose-500"
                  />
                  abort
                </label>
                <button
                  onClick={() => setActiveScenario((p) => ({ ...p, thresholds: p.thresholds.filter((_, i) => i !== idx) }))}
                  className="ml-auto text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
