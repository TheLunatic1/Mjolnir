import React from 'react';
import { useStore } from '../../store';
import { Settings, Shield, Activity, Radio, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activeScenario, setActiveScenario, enginePort, setEnginePort } = useStore();
  const tls = activeScenario.tls;
  const exp = activeScenario.exporters;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">Global Configuration</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            TLS Security, Ports & Telemetry Exporters
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TLS Card */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">TLS / SSL Handshake Configuration</h3>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
            <div>
              <div className="text-sm font-semibold text-slate-200">Insecure Skip Verify</div>
              <div className="text-xs text-slate-400">Ignore invalid or self-signed certificates during stress test</div>
            </div>
            <input
              type="checkbox"
              checked={tls.insecureSkipVerify}
              onChange={(e) => setActiveScenario((p) => ({ ...p, tls: { ...p.tls, insecureSkipVerify: e.target.checked } }))}
              className="w-4 h-4 accent-primary-500 rounded"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Minimum TLS Protocol Version</label>
            <select
              value={tls.minVersion || 'TLS1.2'}
              onChange={(e) => setActiveScenario((p) => ({ ...p, tls: { ...p.tls, minVersion: e.target.value as any } }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400"
            >
              <option value="TLS1.2">TLS 1.2 (Standard Enterprise)</option>
              <option value="TLS1.3">TLS 1.3 (Modern High-Speed)</option>
            </select>
          </div>
        </div>

        {/* Engine IPC Port */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Node / Rust IPC Communication</h3>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Loopback WebSocket Port</label>
            <input
              type="number"
              value={enginePort}
              onChange={(e) => setEnginePort(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 font-bold"
            />
            <p className="text-[11px] text-slate-500 mt-1">Must match the port passed to the native Rust engine binary.</p>
          </div>
        </div>
      </div>

      {/* Exporters Grid */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Live Observability Telemetry Exporters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prometheus */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2"><Radio className="w-4 h-4 text-emerald-400" /> Prometheus</span>
              <input
                type="checkbox"
                checked={exp.prometheus.enabled}
                onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, prometheus: { ...p.exporters.prometheus, enabled: e.target.checked } } }))}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>
            <div className="text-xs font-mono text-slate-400 space-y-2">
              <div>Port: <input type="number" value={exp.prometheus.port} onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, prometheus: { ...p.exporters.prometheus, port: Number(e.target.value) } } }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-400 mt-1" /></div>
              <div>Path: <input type="text" value={exp.prometheus.path} onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, prometheus: { ...p.exporters.prometheus, path: e.target.value } } }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-1" /></div>
            </div>
          </div>

          {/* InfluxDB */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2"><Radio className="w-4 h-4 text-cyan-400" /> InfluxDB v2</span>
              <input
                type="checkbox"
                checked={exp.influxdb.enabled}
                onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, influxdb: { ...p.exporters.influxdb, enabled: e.target.checked } } }))}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>
            <div className="text-xs font-mono text-slate-400 space-y-2">
              <div>URL: <input type="text" value={exp.influxdb.url} onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, influxdb: { ...p.exporters.influxdb, url: e.target.value } } }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-1" /></div>
              <div>Bucket: <input type="text" value={exp.influxdb.bucket} onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, influxdb: { ...p.exporters.influxdb, bucket: e.target.value } } }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-1" /></div>
            </div>
          </div>

          {/* Datadog */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-200 flex items-center gap-2"><Radio className="w-4 h-4 text-violet-400" /> Datadog DogStatsD</span>
              <input
                type="checkbox"
                checked={exp.datadog.enabled}
                onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, datadog: { ...p.exporters.datadog, enabled: e.target.checked } } }))}
                className="w-4 h-4 accent-violet-500 rounded"
              />
            </div>
            <div className="text-xs font-mono text-slate-400 space-y-2">
              <div>Host: <input type="text" value={exp.datadog.host} onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, datadog: { ...p.exporters.datadog, host: e.target.value } } }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-1" /></div>
              <div>Port: <input type="number" value={exp.datadog.port} onChange={(e) => setActiveScenario((p) => ({ ...p, exporters: { ...p.exporters, datadog: { ...p.exporters.datadog, port: Number(e.target.value) } } }))} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-violet-400 mt-1" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* About & License */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-primary-950/20">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg font-extrabold text-white font-['Outfit',sans-serif] flex items-center justify-center md:justify-start gap-2">
            MJOLNIR — Enterprise Load & Stress Testing
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">Apache-2.0 License</span>
          </h3>
          <p className="text-sm text-slate-400">
            Designed and engineered for massive multi-protocol load generation and distributed cluster stress testing.
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
            <strong className="text-slate-400">Attribution Requirement:</strong> As per Section 4(d) of the Apache License 2.0, any redistributions or forks MUST visibly display attribution to &ldquo;TheLunatic1 (Salman Toha)&rdquo; in the GUI and include a reference to https://github.com/TheLunatic1.
          </p>
        </div>
        <div className="text-right flex flex-col items-center md:items-end">
          <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Created By</span>
          <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary-400">
            TheLunatic1 (Salman Toha)
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5">Copyright © 2026 All Rights Reserved</span>
        </div>
      </div>
    </div>
  );
};
