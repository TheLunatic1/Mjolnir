import React from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { FileText, Download, Trash2, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { pastReports, addLog } = useStore();

  const handleExportHtml = async (report: any) => {
    if (!window.mjolnir) return;
    const res = await window.mjolnir.reports.generateHtml(report);
    if (res.success) {
      addLog({ level: 'info', source: 'ipc', message: 'HTML Report generated successfully.' });
    }
  };

  const handleExportPdf = async (report: any) => {
    if (!window.mjolnir) return;
    const res = await window.mjolnir.reports.generatePdf(report);
    if (res.success) {
      addLog({ level: 'info', source: 'ipc', message: 'PDF Summary generated successfully.' });
    }
  };

  const sampleReports = pastReports.length > 0 ? pastReports : [
    {
      id: 'run_sample_1',
      scenarioName: 'Enterprise API Stress Target (Sample)',
      timestamp: new Date().toLocaleString(),
      totalRequests: 125000,
      successfulRequests: 124980,
      failedRequests: 20,
      peakRps: 1850,
      latencies: {
        total_duration: { p50: 42.5, p90: 88.2, p95: 112.0, p99: 185.4, max: 310.1 }
      }
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Audit & Artifact Engine</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Completed Run Reports & PDF/HTML Export
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        {sampleReports.map((rep) => {
          const errorRate = (rep.failedRequests / Math.max(1, rep.totalRequests)) * 100;
          return (
            <div key={rep.id} className="glass-card p-6 rounded-xl border border-slate-800 space-y-4 transition-all hover:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">{rep.scenarioName}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                      <Calendar className="w-3.5 h-3.5" /> Completed: {rep.timestamp}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={errorRate === 0 ? 'emerald' : 'rose'} size="md">
                    {errorRate === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {errorRate === 0 ? '100% SUCCESS' : `${errorRate.toFixed(2)}% ERROR`}
                  </Badge>
                  <Button variant="secondary" size="sm" onClick={() => handleExportHtml(rep)} icon={<Download className="w-3.5 h-3.5" />}>
                    HTML Report
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleExportPdf(rep)} icon={<Download className="w-3.5 h-3.5" />}>
                    PDF Summary
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Total Requests</span>
                  <span className="text-lg font-bold text-slate-100">{rep.totalRequests.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Peak RPS</span>
                  <span className="text-lg font-bold text-emerald-400">{rep.peakRps.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">P50 Median</span>
                  <span className="text-lg font-bold text-cyan-400">{rep.latencies?.total_duration?.p50?.toFixed(1)} ms</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">P95 Latency</span>
                  <span className="text-lg font-bold text-amber-400">{rep.latencies?.total_duration?.p95?.toFixed(1)} ms</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">P99 Latency</span>
                  <span className="text-lg font-bold text-rose-400">{rep.latencies?.total_duration?.p99?.toFixed(1)} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
