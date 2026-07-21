import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import type { BenchmarkPhaseResult, BenchmarkResult, BenchmarkTier, SystemInfo } from '../../types';
import {
  Cpu, MemoryStick, Wifi, Zap, Play, Square, CheckCircle2, AlertCircle,
  Activity, Globe, Monitor, ChevronRight, BarChart3, Server, Network,
  Gauge, Flame, ArrowRight, RefreshCw, TrendingUp, AlertTriangle, Info, ArrowUpRight,
} from 'lucide-react';

const TIER_CONFIG: Record<BenchmarkTier, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; desc: string }> = {
  low:   { label: 'Low Tier',   color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/40',   icon: <AlertCircle className="w-5 h-5" />, desc: 'Limited hardware — keep VUs low and tests short' },
  mid:   { label: 'Mid Tier',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/40',  icon: <BarChart3 className="w-5 h-5" />,   desc: 'Capable hardware — good for medium-scale load testing' },
  high:  { label: 'High Tier',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', icon: <Activity className="w-5 h-5" />,    desc: 'Production-grade — serious load testing capability' },
  beast: { label: 'BEAST MODE', color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40',   icon: <Flame className="w-5 h-5" />,       desc: 'Elite hardware — consider distributed clusters for maximum reach' },
};

const PRESET_TARGETS = [
  { label: 'Cloudflare (1.1.1.1)', value: 'https://1.1.1.1' },
  { label: 'Google', value: 'https://www.google.com' },
  { label: 'GitHub', value: 'https://github.com' },
  { label: 'Custom URL...', value: '__custom__' },
];

function PhaseBadge({ status }: { status: BenchmarkPhaseResult['status'] }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  if (status === 'error') return <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
  if (status === 'running') return (
    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin flex-shrink-0" />
  );
  return <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />;
}

function SystemInfoPanel({ info }: { info: SystemInfo }) {
  const primaryIface = info.networkInterfaces[0];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* CPU */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <Cpu className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Processor</span>
        </div>
        <div className="text-xs font-mono text-slate-200 leading-relaxed">
          <div className="font-bold text-sm text-white truncate" title={info.cpuModel}>{info.cpuModel.replace(/\(R\)|®|™/g, '').trim()}</div>
          <div className="text-slate-400 mt-1">{info.cpuCores} Cores / {info.cpuThreads} Threads</div>
          <div className="text-slate-400">{info.cpuSpeedMhz >= 1000 ? `${(info.cpuSpeedMhz / 1000).toFixed(1)} GHz` : `${info.cpuSpeedMhz} MHz`}</div>
        </div>
      </div>

      {/* RAM */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-violet-400">
          <MemoryStick className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Memory</span>
        </div>
        <div className="text-xs font-mono text-slate-200">
          <div className="font-bold text-sm text-white">{(info.totalRamMb / 1024).toFixed(1)} GB Total</div>
          <div className="text-slate-400 mt-1">{(info.freeRamMb / 1024).toFixed(1)} GB Free</div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
              style={{ width: `${((info.totalRamMb - info.freeRamMb) / info.totalRamMb) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* OS / Platform */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <Monitor className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">System</span>
        </div>
        <div className="text-xs font-mono text-slate-200">
          <div className="font-bold text-sm text-white capitalize">{info.platform === 'win32' ? 'Windows' : info.platform === 'darwin' ? 'macOS' : 'Linux'}</div>
          <div className="text-slate-400 mt-1">{info.arch.toUpperCase()}</div>
          <div className="text-slate-400">{info.hostname}</div>
        </div>
      </div>

      {/* Network */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <Network className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Network</span>
        </div>
        <div className="text-xs font-mono text-slate-200">
          {primaryIface ? (
            <>
              <div className="font-bold text-sm text-white">{primaryIface.address}</div>
              <div className="text-slate-400 mt-1">{primaryIface.name}</div>
              <div className="text-slate-400">{primaryIface.family}</div>
            </>
          ) : (
            <div className="text-slate-400">No external interface detected</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BOTTLENECK ANALYSIS ENGINE ───────────────────────────────────────────────
interface Bottleneck {
  type: 'network_latency' | 'network_bandwidth' | 'ram' | 'cpu' | 'none';
  severity: 'critical' | 'warning' | 'ok';
  label: string;
  impact: string;
  upgrade: string;
  upgradeImpact: string;
}

function analyzeBottlenecks(r: BenchmarkResult, sysInfo?: { totalRamMb: number; cpuScore: number } | null): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  // 1. Network Latency to Target
  if (r.networkLatencyMs > 500) {
    bottlenecks.push({
      type: 'network_latency',
      severity: 'warning',
      label: 'High Target Latency',
      impact: `${r.networkLatencyMs}ms round-trip means each VU holds a connection open longer. To hit high RPS you need MORE VUs, not a faster machine.`,
      upgrade: 'Deploy a worker node closer to the target (same datacenter/region)',
      upgradeImpact: `Moving to a node with ~50ms latency would reduce required VUs by ${Math.round(r.networkLatencyMs / 50)}x for the same RPS`,
    });
  } else if (r.networkLatencyMs > 200) {
    bottlenecks.push({
      type: 'network_latency',
      severity: 'warning',
      label: 'Moderate Target Latency',
      impact: `${r.networkLatencyMs}ms latency — manageable but adds up at scale. Each VU is idle ~${r.networkLatencyMs}ms per request waiting for the server.`,
      upgrade: 'Use a VPN or proxy closer to the target, or add distributed worker nodes',
      upgradeImpact: `Cutting latency to 50ms would let ~${Math.round(r.networkLatencyMs / 50)}x fewer VUs produce the same throughput`,
    });
  }

  // 2. Network Throughput / Bandwidth
  if (r.networkThroughputKbps < 1000) {
    bottlenecks.push({
      type: 'network_bandwidth',
      severity: r.networkThroughputKbps < 200 ? 'critical' : 'warning',
      label: 'Network Bandwidth Bottleneck',
      impact: `Only ${r.networkThroughputKbps} KB/s measured to target. Your local network card can handle far more — the TARGET server is responding slowly or the connection path is congested.`,
      upgrade: 'Check your ISP speed to the target region, or use a VPS/cloud machine closer to target',
      upgradeImpact: `10x better throughput path would allow proportionally more data-heavy load scenarios`,
    });
  }

  // 3. RAM (if system info available)
  if (r.systemInfo && r.systemInfo.totalRamMb < 8192) {
    bottlenecks.push({
      type: 'ram',
      severity: r.systemInfo.totalRamMb < 4096 ? 'critical' : 'warning',
      label: 'RAM Bottleneck for High VUs',
      impact: `${Math.round(r.systemInfo.totalRamMb / 1024)}GB RAM limits parallel VUs. Each Mjolnir VU uses ~100–200KB. At your RAM, safe ceiling is ~${Math.round(r.systemInfo.totalRamMb * 0.6 * 1024 / 150).toLocaleString()} VUs before paging.`,
      upgrade: `Upgrade to 16GB+ RAM`,
      upgradeImpact: `16GB enables ~50,000+ concurrent VUs; 32GB enables 100,000+`,
    });
  }

  // 4. CPU (low score)
  if (r.cpuScore < 5_000_000) {
    bottlenecks.push({
      type: 'cpu',
      severity: 'warning',
      label: 'CPU May Limit Very High VU Counts',
      impact: `CPU score of ${r.cpuScore.toLocaleString()} ops/s. The Rust engine uses async I/O so CPU rarely bottlenecks below 50K VUs, but at extreme loads it matters.`,
      upgrade: 'Upgrade CPU cores or use distributed worker nodes to spread the load',
      upgradeImpact: 'Each additional worker node multiplies total capacity linearly',
    });
  }

  if (bottlenecks.length === 0) {
    bottlenecks.push({
      type: 'none',
      severity: 'ok',
      label: 'No Significant Bottlenecks Detected',
      impact: 'Your machine and network path look healthy for load testing.',
      upgrade: 'Consider distributed workers to scale beyond a single machine',
      upgradeImpact: 'Each additional worker node multiplies total VU capacity linearly',
    });
  }

  return bottlenecks;
}

const SEVERITY_CONFIG = {
  critical: { color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/40',    bar: 'bg-rose-500',    icon: <AlertTriangle className="w-4 h-4" />, label: 'CRITICAL' },
  warning:  { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   bar: 'bg-amber-500',   icon: <AlertCircle className="w-4 h-4" />,   label: 'WARNING'  },
  ok:       { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', bar: 'bg-emerald-500', icon: <CheckCircle2 className="w-4 h-4" />,  label: 'GOOD'     },
};

function BottleneckPanel({ result }: { result: BenchmarkResult }) {
  const [vuInput, setVuInput] = useState(1000);
  const bottlenecks = analyzeBottlenecks(result);

  // VU Projection using Little's Law: RPS = VUs / latency_seconds
  const latSec = Math.max(result.networkLatencyMs, 1) / 1000;
  const projectedRps = Math.round(vuInput / latSec);
  const projectedLatMs = result.networkLatencyMs;
  // Estimate concurrent connections needed
  const connectionsNeeded = vuInput;
  // RAM estimate: ~150KB per VU connection in Rust async engine
  const ramNeededMb = Math.round(vuInput * 0.15);
  // Network estimate: requests/sec × average response size (estimate 8KB avg)
  const estimatedBandwidthMbps = (projectedRps * 8 / 1024).toFixed(1);

  return (
    <div className="space-y-4">
      {/* ── Bottleneck Cards ── */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Bottleneck Analysis</h3>
          <span className="ml-auto text-[11px] font-mono text-slate-500">Based on benchmark against: {result.testTarget}</span>
        </div>

        <div className="space-y-3">
          {bottlenecks.map((bn, i) => {
            const cfg = SEVERITY_CONFIG[bn.severity];
            return (
              <div key={i} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border} space-y-2`}>
                <div className="flex items-center gap-2">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                  <span className="text-sm font-bold text-slate-100">{bn.label}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{bn.impact}</p>
                {bn.severity !== 'ok' && (
                  <div className={`flex items-start gap-2 text-xs ${cfg.color} border-t ${cfg.border} pt-2 mt-2`}>
                    <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Fix: </span>{bn.upgrade}
                      <span className="block text-slate-400 mt-0.5">→ {bn.upgradeImpact}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── VU Projection Calculator ── */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">VU Projection Calculator</h3>
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3 h-3" />
            Uses Little's Law: RPS = VUs ÷ Latency
          </div>
        </div>

        {/* VU Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Virtual Users to Throw</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={vuInput}
                min={1}
                max={100000}
                onChange={(e) => setVuInput(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono font-bold text-cyan-400 text-right focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-mono">VUs</span>
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={50000}
            step={10}
            value={vuInput}
            onChange={(e) => setVuInput(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono">
            <span>10</span><span>1K</span><span>5K</span><span>10K</span><span>25K</span><span>50K</span>
          </div>
        </div>

        {/* Projection Results Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" /> Est. RPS to Target
            </div>
            <div className="text-xl font-black font-mono text-cyan-400">{projectedRps.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500">requests/sec hitting server</div>
          </div>
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 space-y-1">
            <div className="text-[10px] text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3" /> Target Latency
            </div>
            <div className="text-xl font-black font-mono text-violet-400">{projectedLatMs} ms</div>
            <div className="text-[10px] text-slate-500">round-trip to target (measured)</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <MemoryStick className="w-3 h-3" /> RAM Needed
            </div>
            <div className="text-xl font-black font-mono text-amber-400">~{ramNeededMb >= 1024 ? `${(ramNeededMb/1024).toFixed(1)}GB` : `${ramNeededMb}MB`}</div>
            <div className="text-[10px] text-slate-500">~150KB per VU (Rust async)</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Network className="w-3 h-3" /> Bandwidth Used
            </div>
            <div className="text-xl font-black font-mono text-emerald-400">~{estimatedBandwidthMbps} Mbps</div>
            <div className="text-[10px] text-slate-500">estimated outbound (8KB avg req)</div>
          </div>
        </div>

        {/* Feasibility verdict */}
        {(() => {
          const ramOk   = result.systemInfo ? ramNeededMb < result.systemInfo.totalRamMb * 0.7 : true;
          const bwOk    = parseFloat(estimatedBandwidthMbps) < 900; // below 1Gbps
          const feasible = ramOk && bwOk;
          return (
            <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${feasible ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
              {feasible
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              }
              <div>
                {feasible
                  ? <><strong>{vuInput.toLocaleString()} VUs is feasible from this machine.</strong> The Rust async engine (Tokio) handles this concurrency level efficiently. Expect ~{projectedRps.toLocaleString()} RPS hitting the target.</>
                  : <>
                      <strong>{vuInput.toLocaleString()} VUs may exceed local limits.</strong>{' '}
                      {!ramOk && `RAM needed (~${ramNeededMb >= 1024 ? `${(ramNeededMb/1024).toFixed(1)}GB` : `${ramNeededMb}MB`}) exceeds safe usage. `}
                      {!bwOk && `Bandwidth (~${estimatedBandwidthMbps} Mbps) approaches network card limits. `}
                      Use <strong>distributed worker nodes</strong> to split the load.
                    </>
                }
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export const BenchmarkPage: React.FC = () => {
  const { benchmarkResult, setBenchmarkResult, isBenchmarking, setIsBenchmarking, setActiveScenario, addLog } = useStore();
  const [selectedPreset, setSelectedPreset] = useState(PRESET_TARGETS[0].value);
  const [customUrl, setCustomUrl] = useState('');
  const [phases, setPhases] = useState<BenchmarkPhaseResult[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const progressUnsubRef = useRef<(() => void) | null>(null);

  const testTarget = selectedPreset === '__custom__' ? customUrl : selectedPreset;

  // Load system info on mount
  useEffect(() => {
    if (!window.mjolnir) return;
    setLoadingInfo(true);
    window.mjolnir.system.getInfo().then((res: any) => {
      if (res.success) setSystemInfo(res.data);
      setLoadingInfo(false);
    });
  }, []);

  // Also use system info from last benchmark result if no live info yet
  const displayInfo = systemInfo ?? benchmarkResult?.systemInfo ?? null;

  const phaseNames = [
    'Connectivity Check',
    'Network Latency',
    'Concurrency Stress',
    'CPU Throughput',
    'Throughput Estimate',
  ];

  const getInitialPhases = (): BenchmarkPhaseResult[] =>
    phaseNames.map((name) => ({ name, status: 'pending', durationMs: 0, value: 0, unit: '' }));

  const handleRun = async () => {
    if (!window.mjolnir || !testTarget) return;
    if (selectedPreset === '__custom__' && !customUrl.trim()) return;

    setBenchmarkError(null);
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    setPhases(getInitialPhases());
    addLog({ level: 'info', source: 'ipc', message: `🔬 Starting PC Benchmark against ${testTarget}...` });

    // Subscribe to real-time phase progress
    if (progressUnsubRef.current) progressUnsubRef.current();
    progressUnsubRef.current = window.mjolnir.benchmark.onProgress((phase: BenchmarkPhaseResult) => {
      setPhases((prev) => {
        const idx = prev.findIndex((p) => p.name === phase.name);
        if (idx === -1) return [...prev, phase];
        const next = [...prev];
        next[idx] = phase;
        return next;
      });
    });

    const res = await window.mjolnir.benchmark.run(testTarget);

    if (progressUnsubRef.current) {
      progressUnsubRef.current();
      progressUnsubRef.current = null;
    }

    setIsBenchmarking(false);

    if (res.success) {
      setBenchmarkResult(res.data);
      setPhases(res.data.phases);
      addLog({ level: 'info', source: 'ipc', message: `✅ Benchmark complete! Tier: ${res.data.tier.toUpperCase()}  |  Est. Max RPS: ${res.data.estimatedMaxRps}` });
    } else {
      setBenchmarkError(res.error ?? 'Benchmark failed.');
      addLog({ level: 'error', source: 'ipc', message: `Benchmark failed: ${res.error}` });
    }
  };

  const handleCancel = async () => {
    if (!window.mjolnir) return;
    await window.mjolnir.benchmark.cancel();
    setIsBenchmarking(false);
    addLog({ level: 'warn', source: 'ipc', message: 'Benchmark cancelled by user.' });
  };

  const handleApplyToScenario = () => {
    if (!benchmarkResult) return;
    setActiveScenario((prev) => ({
      ...prev,
      execution: {
        ...prev.execution,
        maxVUs: benchmarkResult.estimatedSafeVus,
        vus: Math.round(benchmarkResult.estimatedSafeVus * 0.5),
        targetRps: benchmarkResult.estimatedMaxRps,
      },
    }));
    addLog({ level: 'info', source: 'ipc', message: `Applied benchmark results: maxVUs=${benchmarkResult.estimatedSafeVus}, targetRPS=${benchmarkResult.estimatedMaxRps}` });
  };

  const tier = benchmarkResult?.tier;
  const tierCfg = tier ? TIER_CONFIG[tier] : null;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/20">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Hardware Capability Assessment</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            PC Benchmark & Load Capacity Analyzer
          </h1>
          <p className="text-xs text-slate-400 mt-1">Discover your machine's real-world load testing ceiling before launching a strike.</p>
        </div>
        <div className="flex items-center gap-3">
          {isBenchmarking ? (
            <Button variant="danger" size="md" onClick={handleCancel} icon={<Square className="w-4 h-4 fill-current" />}>
              Cancel Benchmark
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={handleRun} icon={<Play className="w-4 h-4 fill-current" />} disabled={!testTarget || (selectedPreset === '__custom__' && !customUrl.trim())}>
              Run Benchmark
            </Button>
          )}
        </div>
      </div>

      {/* System Specs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-['Outfit',sans-serif] flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Your System Specs
          </h2>
          {loadingInfo && <span className="text-xs text-slate-500 font-mono animate-pulse">Detecting hardware...</span>}
        </div>
        {displayInfo ? (
          <SystemInfoPanel info={displayInfo} />
        ) : (
          !loadingInfo && (
            <div className="glass-card p-6 rounded-xl border border-slate-800 text-center text-slate-500 text-sm">
              System info not available (run in Electron app).
            </div>
          )
        )}
      </div>

      {/* Test Target Selector */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Globe className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Benchmark Test Target</h3>
          <span className="text-xs text-slate-500 ml-auto">Network tests will hit this endpoint</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {PRESET_TARGETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSelectedPreset(preset.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border ${
                selectedPreset === preset.value
                  ? 'bg-gradient-to-r from-primary-600/20 to-cyan-600/10 border-primary-500/60 text-cyan-300'
                  : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 bg-slate-900/50'
              }`}
            >
              {preset.value !== '__custom__' ? (
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedPreset === preset.value ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  {preset.label}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedPreset === '__custom__' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                  Custom URL
                </div>
              )}
            </button>
          ))}
        </div>
        {selectedPreset === '__custom__' && (
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://your-target.com"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-primary-500 focus:outline-none"
          />
        )}
        {selectedPreset !== '__custom__' && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 px-1">
            <Wifi className="w-3.5 h-3.5" />
            Active target: <span className="text-cyan-400">{testTarget}</span>
          </div>
        )}
      </div>

      {/* Benchmark Phases */}
      {(isBenchmarking || phases.length > 0) && (
        <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Gauge className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Benchmark Progress</h3>
            {isBenchmarking && (
              <div className="ml-auto flex items-center gap-1.5 text-xs text-cyan-400 font-mono animate-pulse">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Running...
              </div>
            )}
          </div>
          <div className="space-y-2">
            {(phases.length > 0 ? phases : getInitialPhases()).map((phase, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-all ${
                phase.status === 'running'
                  ? 'bg-cyan-500/5 border-cyan-500/30'
                  : phase.status === 'done'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : phase.status === 'error'
                  ? 'bg-rose-500/5 border-rose-500/30'
                  : 'bg-slate-900/40 border-slate-800'
              }`}>
                <PhaseBadge status={phase.status} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 text-xs">{phase.name}</div>
                  {phase.detail && <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">{phase.detail}</div>}
                </div>
                {phase.status === 'done' && (
                  <div className="text-xs font-mono font-bold text-cyan-400 flex-shrink-0">
                    {phase.value.toLocaleString()} {phase.unit}
                  </div>
                )}
                {phase.status === 'running' && (
                  <div className="text-xs font-mono text-slate-500 flex-shrink-0 animate-pulse">measuring...</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {benchmarkError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-rose-300 mb-0.5">Benchmark Failed</div>
            <div className="text-xs font-mono text-rose-400">{benchmarkError}</div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {benchmarkResult && !isBenchmarking && tierCfg && (
        <div className="space-y-4">
          {/* Tier Badge */}
          <div className={`flex items-center justify-between p-5 rounded-xl border-2 ${tierCfg.bg} ${tierCfg.border} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tierCfg.bg} border ${tierCfg.border} ${tierCfg.color}`}>
                {tierCfg.icon}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">Benchmark Tier</div>
                <div className={`text-2xl font-black font-['Outfit',sans-serif] ${tierCfg.color}`}>{tierCfg.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{tierCfg.desc}</div>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleApplyToScenario}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Apply to Scenario
            </Button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Network Latency', value: `${benchmarkResult.networkLatencyMs} ms`, color: 'text-cyan-400', icon: <Wifi className="w-4 h-4" /> },
              { label: 'Network Throughput', value: `${benchmarkResult.networkThroughputKbps} KB/s`, color: 'text-emerald-400', icon: <Network className="w-4 h-4" /> },
              { label: 'CPU Score', value: `${benchmarkResult.cpuScore.toLocaleString()} ops/s`, color: 'text-violet-400', icon: <Cpu className="w-4 h-4" /> },
              { label: 'Concurrent Conns', value: `${benchmarkResult.concurrentConnectionsAchieved}`, color: 'text-amber-400', icon: <Activity className="w-4 h-4" /> },
              { label: 'Est. Max RPS', value: `~${benchmarkResult.estimatedMaxRps}`, color: 'text-rose-400', icon: <Zap className="w-4 h-4" /> },
              { label: 'Safe VU Ceiling', value: `~${benchmarkResult.estimatedSafeVus} VUs`, color: 'text-primary-400', icon: <Gauge className="w-4 h-4" /> },
            ].map((m, i) => (
              <div key={i} className="glass-card p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${m.color}`}>{m.icon}{m.label}</div>
                <div className={`text-base font-black font-mono ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* ─── BOTTLENECK ANALYSIS ─── */}
          <BottleneckPanel result={benchmarkResult} />

          {/* Recommendations */}
          <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Recommendations</h3>
              <span className="ml-auto text-[11px] font-mono text-slate-500">Tested at: {benchmarkResult.testTarget}</span>
            </div>
            <div className="space-y-2">
              {benchmarkResult.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Re-run */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleRun} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Re-run Benchmark
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
