import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { MetricCard } from '../dashboard/MetricCard';
import { LiveChart } from '../dashboard/LiveChart';
import { Server, Cpu, HardDrive, Network, Play, Square, CheckCircle2 } from 'lucide-react';

export const HostMonitoringPage: React.FC = () => {
  const { activeScenario, setActiveScenario, hostStats, hostStatsHistory } = useStore();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const cfg = activeScenario.sshMonitoring;

  const handleStart = async () => {
    if (!window.mjolnir) return;
    setIsMonitoring(true);
    await window.mjolnir.ssh.start(cfg);
  };

  const handleStop = async () => {
    if (!window.mjolnir) return;
    setIsMonitoring(false);
    await window.mjolnir.ssh.stop();
  };

  const labels = hostStatsHistory.map((_, i) => `${i * (cfg.pollIntervalMs / 1000)}s`);
  const cpuData = hostStatsHistory.map((f) => f.cpu_usage_percent);
  const memData = hostStatsHistory.map((f) => f.memory_usage_percent);
  const diskReadData = hostStatsHistory.map((f) => f.disk_io_read_kbps);
  const diskWriteData = hostStatsHistory.map((f) => f.disk_io_write_kbps);

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
        <MetricCard
          title="CPU Utilization"
          value={`${hostStats?.cpu_usage_percent || 0}%`}
          subtitle="All Cores Combined"
          icon={<Cpu className="w-6 h-6" />}
          color="rose"
        />
        <MetricCard
          title="RAM Utilization"
          value={`${hostStats?.memory_usage_percent || 0}%`}
          subtitle={`${Math.round(hostStats?.memory_used_mb || 0)} MB / ${Math.round(hostStats?.memory_total_mb || 16384)} MB`}
          icon={<Server className="w-6 h-6" />}
          color="cyan"
        />
        <MetricCard
          title="Disk I/O Read/Write"
          value={`${Math.round(hostStats?.disk_io_write_kbps || 0)} KB/s`}
          subtitle={`Read: ${Math.round(hostStats?.disk_io_read_kbps || 0)} KB/s`}
          icon={<HardDrive className="w-6 h-6" />}
          color="amber"
        />
        <MetricCard
          title="Network Interface TX"
          value={`${((hostStats?.network_tx_kbps || 0) / 1024).toFixed(1)} MB/s`}
          subtitle={`RX: ${((hostStats?.network_rx_kbps || 0) / 1024).toFixed(1)} MB/s`}
          icon={<Network className="w-6 h-6" />}
          color="violet"
        />
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
