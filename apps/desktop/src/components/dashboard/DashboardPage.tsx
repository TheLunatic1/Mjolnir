import React from 'react';
import { useStore } from '../../store';
import { MetricCard } from './MetricCard';
import { LiveChart } from './LiveChart';
import { Users, Zap, Clock, AlertTriangle, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { liveMetrics, metricsHistory, activeScenario } = useStore();

  const labels = metricsHistory.map((f) => `${Math.round(f.elapsed_seconds)}s`);
  
  const rpsData = metricsHistory.map((f) => Math.round(f.current_rps));
  const vusData = metricsHistory.map((f) => f.current_vus);

  const p50Data = metricsHistory.map((f) => Number(f.latencies.total_duration.p50.toFixed(1)));
  const p95Data = metricsHistory.map((f) => Number(f.latencies.total_duration.p95.toFixed(1)));
  const p99Data = metricsHistory.map((f) => Number(f.latencies.total_duration.p99.toFixed(1)));

  const bwInData = metricsHistory.map((f) => Number((f.bandwidth_in_bytes_per_sec / 1024).toFixed(1)));
  const bwOutData = metricsHistory.map((f) => Number((f.bandwidth_out_bytes_per_sec / 1024).toFixed(1)));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-panel to-primary-950/20">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Live Execution Plane</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Real-Time Telemetry & SLA Assertions
          </h1>
        </div>
        <div className="text-right font-mono">
          <div className="text-xs text-slate-400">Total Requests Processed</div>
          <div className="text-3xl font-black text-cyan-400 animate-pulse">
            {liveMetrics?.total_requests.toLocaleString() || '0'}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Virtual Users"
          value={liveMetrics?.current_vus || 0}
          subtitle={`Target Peak: ${activeScenario.execution.maxVUs || activeScenario.execution.vus || 100}`}
          icon={<Users className="w-6 h-6" />}
          color="cyan"
        />
        <MetricCard
          title="Global Throughput (RPS)"
          value={Math.round(liveMetrics?.current_rps || 0)}
          subtitle="Requests Per Second"
          icon={<Zap className="w-6 h-6" />}
          color="emerald"
          trend={{ value: 'Live 60fps', isPositive: true }}
        />
        <MetricCard
          title="99th Percentile Latency"
          value={`${(liveMetrics?.latencies?.total_duration?.p99 || 0).toFixed(1)} ms`}
          subtitle={`P50 Median: ${(liveMetrics?.latencies?.total_duration?.p50 || 0).toFixed(1)} ms`}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
        />
        <MetricCard
          title="Error Rate (%)"
          value={`${(liveMetrics?.error_rate || 0).toFixed(2)}%`}
          subtitle={`Failed: ${liveMetrics?.failed_requests || 0} / Success: ${liveMetrics?.successful_requests || 0}`}
          icon={<AlertTriangle className="w-6 h-6" />}
          color={((liveMetrics?.error_rate || 0) > 0 ? 'rose' : 'violet')}
        />
      </div>

      {/* WebGL/Canvas Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveChart
          title="RPS vs Virtual Users Throughput"
          labels={labels}
          datasets={[
            { label: 'Throughput (RPS)', data: rpsData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
            { label: 'Concurrent VUs', data: vusData, borderColor: '#00f2fe', backgroundColor: 'rgba(0, 242, 254, 0.1)' },
          ]}
          height={320}
        />

        <LiveChart
          title="Latency Percentile Histograms (ms)"
          labels={labels}
          yAxisUnit=" ms"
          datasets={[
            { label: 'P99 Latency', data: p99Data, borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.15)' },
            { label: 'P95 Latency', data: p95Data, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
            { label: 'P50 Median', data: p50Data, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.05)' },
          ]}
          height={320}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandwidth Chart */}
        <div className="lg:col-span-2">
          <LiveChart
            title="Network Bandwidth (KB/s)"
            labels={labels}
            yAxisUnit=" KB/s"
            datasets={[
              { label: 'Network Out (TX)', data: bwOutData, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.15)' },
              { label: 'Network In (RX)', data: bwInData, borderColor: '#00c6fb', backgroundColor: 'rgba(0, 198, 251, 0.1)' },
            ]}
            height={260}
          />
        </div>

        {/* Live SLA Assertion Thresholds Panel */}
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-[260px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-['Outfit',sans-serif]">SLA Thresholds & Assertions</h3>
              <span className="text-[10px] text-slate-400 font-mono">{activeScenario.thresholds.length} Rules Active</span>
            </div>
            <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
              {activeScenario.thresholds.map((rule, idx) => {
                const isFailed = (liveMetrics?.error_rate || 0) > rule.value && rule.metric.includes('failed');
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                    <span className="text-slate-300 truncate max-w-[180px]">{rule.metric} ({rule.aggregation}) {rule.operator} {rule.value}</span>
                    <span className={`flex items-center gap-1 font-bold ${!isFailed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {!isFailed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {!isFailed ? 'PASS' : 'BREACH'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Auto-Abort on Breach: <strong>Enabled</strong></span>
            <ArrowUpRight className="w-3.5 h-3.5 text-primary-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
