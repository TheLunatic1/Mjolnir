import https from 'https';
import http from 'http';
import { performance } from 'perf_hooks';
import os from 'os';
import { getSystemInfo } from './systemInfo';

// Inline types to avoid workspace alias resolution issues in electron compilation
type BenchmarkTier = 'low' | 'mid' | 'high' | 'beast';

interface SystemInfo {
  cpuModel: string;
  cpuCores: number;
  cpuThreads: number;
  cpuSpeedMhz: number;
  totalRamMb: number;
  freeRamMb: number;
  platform: string;
  arch: string;
  osRelease: string;
  hostname: string;
  networkInterfaces: Array<{ name: string; address: string; family: 'IPv4' | 'IPv6'; internal: boolean }>;
  uptimeSeconds: number;
}

interface BenchmarkPhaseResult {
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  durationMs: number;
  value: number;
  unit: string;
  detail?: string;
}

interface BenchmarkResult {
  systemInfo: SystemInfo;
  testTarget: string;
  networkLatencyMs: number;
  networkThroughputKbps: number;
  concurrentConnectionsAchieved: number;
  cpuScore: number;
  estimatedMaxRps: number;
  estimatedSafeVus: number;
  estimatedNetworkCeilingMbps: number;
  tier: BenchmarkTier;
  phases: BenchmarkPhaseResult[];
  completedAt: string;
  recommendations: string[];
}

// Event callback for live progress reporting back to renderer
type ProgressCallback = (phase: BenchmarkPhaseResult) => void;

let isCancelled = false;

export function cancelBenchmark() {
  isCancelled = true;
}

/**
 * Makes a single timed HTTP/HTTPS GET request. Returns { latencyMs, sizeBytes, error }.
 */
function timedRequest(
  url: string
): Promise<{ latencyMs: number; sizeBytes: number; statusCode?: number; error?: string }> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const t0 = performance.now();
    let sizeBytes = 0;
    const req = lib.get(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        headers: {
          'User-Agent': 'Mjolnir-Benchmark/1.0',
          'Accept': '*/*',
          'Connection': 'close',
        },
        timeout: 8000,
        rejectUnauthorized: false,
      },
      (res) => {
        res.on('data', (chunk) => {
          sizeBytes += chunk.length;
        });
        res.on('end', () => {
          const latencyMs = performance.now() - t0;
          resolve({ latencyMs, sizeBytes, statusCode: res.statusCode });
        });
        res.on('error', (e) => {
          resolve({ latencyMs: performance.now() - t0, sizeBytes: 0, error: e.message });
        });
      }
    );
    req.on('error', (e) => {
      resolve({ latencyMs: performance.now() - t0, sizeBytes: 0, error: e.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ latencyMs: 8000, sizeBytes: 0, error: 'timeout' });
    });
  });
}

/**
 * CPU benchmark: measures how fast the host can do number-crunching.
 * Returns ops/second score.
 */
function cpuBenchmark(): number {
  const start = performance.now();
  let iterations = 0;
  // Run for ~300ms of pure computation
  while (performance.now() - start < 300) {
    // Fibonacci-like computation to stress the scheduler
    let a = 0, b = 1;
    for (let i = 0; i < 5000; i++) {
      [a, b] = [b, a + b];
    }
    iterations++;
  }
  const elapsed = (performance.now() - start) / 1000;
  return Math.round(iterations / elapsed);
}

/**
 * Determine benchmark tier based on metrics.
 */
function determineTier(estimatedMaxRps: number, cpuCores: number, totalRamMb: number): BenchmarkTier {
  const score = estimatedMaxRps * 0.5 + cpuCores * 50 + totalRamMb * 0.01;
  if (score >= 2000) return 'beast';
  if (score >= 800) return 'high';
  if (score >= 250) return 'mid';
  return 'low';
}

/**
 * Generate human-readable recommendations based on benchmark results.
 */
function buildRecommendations(
  tier: BenchmarkTier,
  estimatedMaxRps: number,
  estimatedSafeVus: number,
  cpuCores: number
): string[] {
  const recs: string[] = [];
  recs.push(`Your machine can safely sustain up to ~${estimatedSafeVus} Virtual Users.`);
  recs.push(`Estimated peak RPS ceiling: ~${estimatedMaxRps} req/s.`);

  if (tier === 'beast') {
    recs.push('Your hardware is exceptional. Consider distributed mode to push even further.');
    recs.push('Enable Prometheus + InfluxDB exporters to capture all metrics at scale.');
  } else if (tier === 'high') {
    recs.push('Great hardware for production-grade load testing.');
    recs.push('For targets above 5,000 RPS, add a distributed worker node.');
  } else if (tier === 'mid') {
    recs.push('Suitable for mid-range load tests. Keep total VUs below 200 for stable results.');
    recs.push('Close other applications before running long soak tests.');
  } else {
    recs.push('Low-tier hardware detected. Keep VUs below 50 and duration under 60s.');
    recs.push('For serious load testing, consider adding a cloud worker node via the Distributed tab.');
  }

  if (cpuCores >= 8) {
    recs.push(`${cpuCores} threads detected — Mjolnir can spread load efficiently across all cores.`);
  }
  return recs;
}

/**
 * Main benchmark runner. Calls progressCallback after each phase completes.
 */
export async function runBenchmark(
  testTarget: string,
  progressCallback: ProgressCallback
): Promise<BenchmarkResult> {
  isCancelled = false;
  const systemInfo: SystemInfo = getSystemInfo();
  const phases: BenchmarkPhaseResult[] = [];

  // ── Phase 1: Connectivity Check ────────────────────────────────────────────
  {
    progressCallback({ name: 'Connectivity Check', status: 'running', durationMs: 0, value: 0, unit: 'ms' });
    const t0 = performance.now();
    const warmup = await timedRequest(testTarget);
    const durationMs = performance.now() - t0;
    const phase: BenchmarkPhaseResult = {
      name: 'Connectivity Check',
      status: warmup.error ? 'error' : 'done',
      durationMs,
      value: Math.round(warmup.latencyMs),
      unit: 'ms',
      detail: warmup.error
        ? `Failed: ${warmup.error}`
        : `HTTP ${warmup.statusCode} — ${Math.round(warmup.sizeBytes / 1024)} KB received`,
    };
    phases.push(phase);
    progressCallback(phase);
    if (isCancelled) throw new Error('Benchmark cancelled');
    if (warmup.error) {
      // Still continue — don't block other phases
    }
  }

  // ── Phase 2: Network Latency (20 sequential requests) ──────────────────────
  {
    progressCallback({ name: 'Network Latency', status: 'running', durationMs: 0, value: 0, unit: 'ms' });
    const t0 = performance.now();
    const latencies: number[] = [];
    for (let i = 0; i < 20; i++) {
      if (isCancelled) throw new Error('Benchmark cancelled');
      const r = await timedRequest(testTarget);
      if (!r.error) latencies.push(r.latencyMs);
    }
    const durationMs = performance.now() - t0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 9999;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 9999;
    const phase: BenchmarkPhaseResult = {
      name: 'Network Latency',
      status: 'done',
      durationMs,
      value: Math.round(p50),
      unit: 'ms',
      detail: `P50: ${Math.round(p50)} ms  |  P99: ${Math.round(p99)} ms  (${latencies.length}/20 succeeded)`,
    };
    phases.push(phase);
    progressCallback(phase);
    if (isCancelled) throw new Error('Benchmark cancelled');
  }

  // ── Phase 3: Concurrency Stress (batch of 30 parallel requests) ───────────
  {
    progressCallback({ name: 'Concurrency Stress', status: 'running', durationMs: 0, value: 0, unit: 'conn' });
    const t0 = performance.now();
    const batchSize = 30;
    const results = await Promise.allSettled(
      Array.from({ length: batchSize }, () => timedRequest(testTarget))
    );
    const durationMs = performance.now() - t0;
    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && !(r.value as any).error
    ).length;
    const successRps = Math.round((succeeded / (durationMs / 1000)));
    const phase: BenchmarkPhaseResult = {
      name: 'Concurrency Stress',
      status: 'done',
      durationMs,
      value: succeeded,
      unit: 'concurrent',
      detail: `${succeeded}/${batchSize} succeeded  |  ~${successRps} RPS burst  |  ${Math.round(durationMs)} ms total`,
    };
    phases.push(phase);
    progressCallback(phase);
    if (isCancelled) throw new Error('Benchmark cancelled');
  }

  // ── Phase 4: CPU Headroom ────────────────────────────────────────────────
  {
    progressCallback({ name: 'CPU Throughput', status: 'running', durationMs: 0, value: 0, unit: 'ops/s' });
    const t0 = performance.now();
    const cpuScore = cpuBenchmark();
    const durationMs = performance.now() - t0;
    const phase: BenchmarkPhaseResult = {
      name: 'CPU Throughput',
      status: 'done',
      durationMs,
      value: cpuScore,
      unit: 'ops/s',
      detail: `${cpuScore.toLocaleString()} ops/s  |  ${systemInfo.cpuThreads} threads @ ${systemInfo.cpuSpeedMhz} MHz`,
    };
    phases.push(phase);
    progressCallback(phase);
    if (isCancelled) throw new Error('Benchmark cancelled');
  }

  // ── Phase 5: Throughput Estimation ──────────────────────────────────────
  {
    progressCallback({ name: 'Throughput Estimate', status: 'running', durationMs: 0, value: 0, unit: 'KB/s' });
    const t0 = performance.now();
    const batch2 = await Promise.allSettled(
      Array.from({ length: 10 }, () => timedRequest(testTarget))
    );
    const durationMs = performance.now() - t0;
    const totalBytes = batch2.reduce((sum, r) => {
      if (r.status === 'fulfilled' && !(r.value as any).error) {
        return sum + ((r.value as any).sizeBytes ?? 0);
      }
      return sum;
    }, 0);
    const throughputKbps = Math.round(totalBytes / 1024 / (durationMs / 1000));
    const phase: BenchmarkPhaseResult = {
      name: 'Throughput Estimate',
      status: 'done',
      durationMs,
      value: throughputKbps,
      unit: 'KB/s',
      detail: `${throughputKbps} KB/s download  |  ${Math.round(totalBytes / 1024)} KB total in ${Math.round(durationMs)} ms`,
    };
    phases.push(phase);
    progressCallback(phase);
  }

  // ── Calculate Final Metrics ───────────────────────────────────────────────
  const latencyPhase = phases.find((p) => p.name === 'Network Latency');
  const concurrencyPhase = phases.find((p) => p.name === 'Concurrency Stress');
  const throughputPhase = phases.find((p) => p.name === 'Throughput Estimate');
  const cpuPhase = phases.find((p) => p.name === 'CPU Throughput');

  const networkLatencyMs = latencyPhase?.value ?? 100;
  const concurrentConnections = concurrencyPhase?.value ?? 10;
  const throughputKbps = throughputPhase?.value ?? 0;
  const cpuScore = cpuPhase?.value ?? 1000;

  // Estimate RPS ceiling based on CPU cores and latency
  // Formula: threads × (1000ms / latency) × headroom_factor
  const headroomFactor = Math.min(1, cpuScore / 5000); // normalized
  const rpsFromLatency = networkLatencyMs > 0 ? Math.round(1000 / networkLatencyMs) : 50;
  const estimatedMaxRps = Math.max(
    10,
    Math.round(systemInfo.cpuThreads * rpsFromLatency * headroomFactor * 0.8)
  );
  const estimatedSafeVus = Math.max(1, Math.min(estimatedMaxRps, Math.round(systemInfo.cpuThreads * 8)));
  const estimatedNetworkCeilingMbps = Math.round(throughputKbps / 1024 * 10) / 10;

  const tier = determineTier(estimatedMaxRps, systemInfo.cpuCores, systemInfo.totalRamMb);
  const recommendations = buildRecommendations(tier, estimatedMaxRps, estimatedSafeVus, systemInfo.cpuCores);

  return {
    systemInfo,
    testTarget,
    networkLatencyMs: Math.round(networkLatencyMs),
    networkThroughputKbps: throughputKbps,
    concurrentConnectionsAchieved: concurrentConnections,
    cpuScore,
    estimatedMaxRps,
    estimatedSafeVus,
    estimatedNetworkCeilingMbps,
    tier,
    phases,
    completedAt: new Date().toISOString(),
    recommendations,
  };
}
