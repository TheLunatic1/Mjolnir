import React from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { FileText, Download, Trash2, Calendar, CheckCircle2, AlertTriangle, ClipboardList } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { pastReports, addLog, clearReports } = useStore();

  const handleExportHtml = async (report: any) => {
    if (!window.mjolnir) return;
    const res = await window.mjolnir.reports.generateHtml(report);
    if (res.success) {
      addLog({ level: 'info', source: 'ipc', message: 'HTML Report generated successfully.' });
    } else {
      addLog({ level: 'error', source: 'ipc', message: `HTML export failed: ${res.error}` });
    }
  };

  const handleExportPdf = async (report: any) => {
    if (!window.mjolnir) return;
    const res = await window.mjolnir.reports.generatePdf(report);
    if (res.success) {
      addLog({ level: 'info', source: 'ipc', message: 'PDF Summary generated successfully.' });
    } else {
      addLog({ level: 'error', source: 'ipc', message: `PDF export failed: ${res.error}` });
    }
  };

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
        {pastReports.length > 0 && (
          <Button variant="danger" size="sm" onClick={clearReports} icon={<Trash2 className="w-4 h-4" />}>
            Clear History
          </Button>
        )}
      </div>

      {/* True Empty State — no fake sample data */}
      {pastReports.length === 0 && (
        <div className="glass-card p-16 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-300 font-['Outfit',sans-serif] mb-2">No Completed Runs Yet</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Run a load test from the Dashboard to generate a report. Results are automatically saved here when the test completes.
            </p>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">Reports persist across sessions.</div>
        </div>
      )}

      <div className="space-y-4">
        {pastReports.map((rep, idx) => {
          const totalReq = rep.totalRequests ?? 0;
          const failReq = rep.failedRequests ?? 0;
          const peakRps = rep.peakRps ?? 0;
          const p50 = (rep.latencies as any)?.total_duration?.p50 ?? (rep.latencies as any)?.totalDuration?.p50 ?? 0;
          const p95 = (rep.latencies as any)?.total_duration?.p95 ?? (rep.latencies as any)?.totalDuration?.p95 ?? 0;
          const p99 = (rep.latencies as any)?.total_duration?.p99 ?? (rep.latencies as any)?.totalDuration?.p99 ?? 0;
          const scenarioName = (rep as any).scenarioName ?? (rep as any).name ?? `Mjolnir Strike Run #${idx + 1}`;
          const timestamp = (rep as any).timestamp ?? new Date().toLocaleString();
          const errorRate = (failReq / Math.max(1, totalReq)) * 100;

          return (
            <div key={(rep as any).id || `rep_${idx}`} className="glass-card p-6 rounded-xl border border-slate-800 space-y-4 transition-all hover:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">{scenarioName}</h3>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                      <Calendar className="w-3.5 h-3.5" /> Completed: {timestamp}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={errorRate === 0 ? 'emerald' : 'rose'} size="md">
                    {errorRate === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {errorRate === 0 ? '100% SUCCESS' : `${errorRate.toFixed(2)}% ERROR`}
                  </Badge>
                  <Button variant="secondary" size="sm" onClick={() => handleExportHtml(rep)} icon={<Download className="w-3.5 h-3.5" />}>
                    HTML
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleExportPdf(rep)} icon={<Download className="w-3.5 h-3.5" />}>
                    PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Total Requests</span>
                  <span className="text-lg font-bold text-slate-100">{totalReq.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Peak RPS</span>
                  <span className="text-lg font-bold text-emerald-400">{peakRps.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">P50 Median</span>
                  <span className="text-lg font-bold text-cyan-400">{Number(p50).toFixed(1)} ms</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">P95 Latency</span>
                  <span className="text-lg font-bold text-amber-400">{Number(p95).toFixed(1)} ms</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">P99 Latency</span>
                  <span className="text-lg font-bold text-rose-400">{Number(p99).toFixed(1)} ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
