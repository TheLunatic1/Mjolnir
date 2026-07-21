import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { MetricCard } from '../dashboard/MetricCard';
import { LiveChart } from '../dashboard/LiveChart';
import { Server, Cpu, HardDrive, Network, Play, Square, CheckCircle2, Sparkles, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export const HostMonitoringPage: React.FC = () => {
  const { activeScenario, setActiveScenario, hostStats, hostStatsHistory } = useStore();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sshError, setSshError] = useState<string | null>(null);
  const cfg = activeScenario.sshMonitoring;

  // Listen for SSH errors from the main process
  useEffect(() => {
    if (!window.mjolnir) return;
    const unsub = window.mjolnir.ssh.onError((error: string) => {
      setSshError(error);
      setIsMonitoring(false);
    });
    return () => { unsub(); };
  }, []);

  const handleStart = async () => {
    if (!window.mjolnir) return;
    setSshError(null);
    setIsMonitoring(true);
    const res = await window.mjolnir.ssh.start(cfg);
    if (res && !res.success) {
      setSshError(res.error || 'Unknown SSH connection error.');
      setIsMonitoring(false);
    }
  };

  const handleStop = async () => {
    if (!window.mjolnir) return;
    setIsMonitoring(false);
    setSshError(null);
    await window.mjolnir.ssh.stop();
  };

  const labels = hostStatsHistory.map((_, i) => `${i * (cfg.pollIntervalMs / 1000)}s`);
  const cpuData = hostStatsHistory.map((f) => f.cpu_usage_percent ?? 0);
  const memData = hostStatsHistory.map((f) => f.memory_usage_percent ?? 0);
  const diskReadData = hostStatsHistory.map((f) => f.disk_io_read_kbps ?? 0);
  const diskWriteData = hostStatsHistory.map((f) => f.disk_io_write_kbps ?? 0);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">Agentless SSH Target Telemetry</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Remote Host Resource Correlator
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isMonitoring ? (
            <Button variant="emerald" size="md" onClick={handleStart} icon={<Play className="w-4 h-4 fill-current" />}>
              Connect & Monitor Host
            </Button>
          ) : (
            <Button variant="danger" size="md" onClick={handleStop} icon={<Square className="w-4 h-4 fill-current" />}>
              Stop SSH Monitoring
            </Button>
          )}
        </div>
      </div>

      {/* SSH Error Banner */}
      {sshError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-rose-300 mb-0.5">SSH Connection Failed</div>
            <div className="text-xs font-mono text-rose-400/80">{sshError}</div>
            <div className="text-[11px] text-rose-500 mt-1">Check credentials, host availability, and firewall rules.</div>
          </div>
        </div>
      )}

      {/* VIP GLYPH Advertisement Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-cyan-900/40 border-2 border-purple-500/50 p-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-white uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommended Companion App
              </span>
              <span className="text-xs font-semibold text-purple-300">By TheLunatic1 (Salman Toha)</span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight flex items-center gap-2">
              Want Full-Powered Remote Server & Terminal Control? Use <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">GLYPH!</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              While Mjolnir provides lightweight, passive CPU/RAM correlation during stress tests, <strong className="text-white font-semibold">GLYPH</strong> is your ultimate, full-scale SSH terminal and server suite! Manage Docker containers, execute interactive commands, inspect live server logs, and configure databases in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <div className="px-4 py-3 rounded-lg bg-black/40 border border-purple-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Optional Here
              </span>
            </div>
            <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center shadow-lg shadow-purple-600/30 border border-purple-400/40">
              <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-80 block">Pro Tip</span>
              <span className="text-xs font-extrabold flex items-center justify-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5 fill-current" /> Keep GLYPH Open Side-by-Side!
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SSH Connection Config Panel */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Server className="w-5 h-5 text-rose-500" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Target Linux Server SSH Credentials</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Host / IP Address</label>
            <input
              type="text"
              value={cfg.host}
              onChange={(e) => setActiveScenario((p) => ({ ...p, sshMonitoring: { ...p.sshMonitoring, host: e.target.value } }))}
              placeholder="staging-server.internal"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">SSH Port</label>
            <input
              type="number"
              value={cfg.port}
              onChange={(e) => setActiveScenario((p) => ({ ...p, sshMonitoring: { ...p.sshMonitoring, port: Number(e.target.value) } }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Username</label>
            <input
              type="text"
              value={cfg.username}
              onChange={(e) => setActiveScenario((p) => ({ ...p, sshMonitoring: { ...p.sshMonitoring, username: e.target.value } }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Poll Interval (ms)</label>
            <input
              type="number"
              value={cfg.pollIntervalMs}
              onChange={(e) => setActiveScenario((p) => ({ ...p, sshMonitoring: { ...p.sshMonitoring, pollIntervalMs: Number(e.target.value) } }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Host KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <MetricCard title="CPU Utilization" value={`${hostStats?.cpu_usage_percent ?? 0}%`} subtitle="All Cores Combined" icon={<Cpu className="w-6 h-6" />} color="rose" />
        <MetricCard title="RAM Utilization" value={`${hostStats?.memory_usage_percent ?? 0}%`} subtitle={`${Math.round(hostStats?.memory_used_mb ?? 0)} MB / ${Math.round(hostStats?.memory_total_mb ?? 16384)} MB`} icon={<Server className="w-6 h-6" />} color="cyan" />
        <MetricCard title="Disk I/O Read/Write" value={`${Math.round(hostStats?.disk_io_write_kbps ?? 0)} KB/s`} subtitle={`Read: ${Math.round(hostStats?.disk_io_read_kbps ?? 0)} KB/s`} icon={<HardDrive className="w-6 h-6" />} color="amber" />
        <MetricCard title="Network Interface TX" value={`${((hostStats?.network_tx_kbps ?? 0) / 1024).toFixed(1)} MB/s`} subtitle={`RX: ${((hostStats?.network_rx_kbps ?? 0) / 1024).toFixed(1)} MB/s`} icon={<Network className="w-6 h-6" />} color="violet" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveChart
          title="Remote Server CPU & RAM Load (%)"
          labels={labels}
          yAxisUnit="%"
          datasets={[
            { label: 'CPU Usage (%)', data: cpuData, borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.15)' },
            { label: 'RAM Usage (%)', data: memData, borderColor: '#00f2fe', backgroundColor: 'rgba(0, 242, 254, 0.1)' },
          ]}
          height={300}
        />
        <LiveChart
          title="Disk Read / Write Throughput (KB/s)"
          labels={labels}
          yAxisUnit=" KB/s"
          datasets={[
            { label: 'Disk Write (KB/s)', data: diskWriteData, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)' },
            { label: 'Disk Read (KB/s)', data: diskReadData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
          ]}
          height={300}
        />
      </div>
    </div>
  );
};
