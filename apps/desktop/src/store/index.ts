import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  EngineStatus,
  EngineLogMessage,
  LiveMetricsFrame,
  HostStatsFrame,
  TestScenario,
  TestReportSummary,
  BenchmarkResult,
  WorkerNode,
} from '@mjolnir/shared-types';
import type { NavTab } from '../types';

interface MjolnirState {
  // Navigation & UI
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Engine Core State
  engineStatus: EngineStatus;
  setEngineStatus: (status: EngineStatus) => void;
  enginePort: number;
  setEnginePort: (port: number) => void;
  clusterMode: 'standalone' | 'master' | 'worker';
  setClusterMode: (mode: 'standalone' | 'master' | 'worker') => void;

  // Scenario & Test Config
  activeScenario: TestScenario;
  setActiveScenario: (scenario: TestScenario | ((prev: TestScenario) => TestScenario)) => void;

  // Live Telemetry & Analytics
  liveMetrics: LiveMetricsFrame | null;
  metricsHistory: LiveMetricsFrame[];
  hostStats: HostStatsFrame | null;
  hostStatsHistory: HostStatsFrame[];
  addMetricsFrame: (frame: LiveMetricsFrame) => void;
  addHostStatsFrame: (stats: HostStatsFrame) => void;
  clearTelemetry: () => void;

  // Logs
  logs: EngineLogMessage[];
  addLog: (log: EngineLogMessage) => void;
  clearLogs: () => void;

  // Log Drawer UI
  logDrawerOpen: boolean;
  setLogDrawerOpen: (open: boolean) => void;

  // Past Test Reports (persisted)
  pastReports: TestReportSummary[];
  addReport: (report: TestReportSummary) => void;
  clearReports: () => void;

  // Benchmark (persisted)
  benchmarkResult: BenchmarkResult | null;
  setBenchmarkResult: (result: BenchmarkResult | null) => void;
  isBenchmarking: boolean;
  setIsBenchmarking: (v: boolean) => void;

  // Distributed Worker Nodes (persisted)
  workerNodes: WorkerNode[];
  addWorkerNode: (node: WorkerNode) => void;
  removeWorkerNode: (id: string) => void;
  updateWorkerNode: (id: string, updates: Partial<WorkerNode>) => void;
  clearWorkerNodes: () => void;
}

const DEFAULT_SCENARIO: TestScenario = {
  id: 'scenario_01',
  name: 'Enterprise API Stress Target',
  description: 'Simulating high-concurrency multi-protocol production load',
  execution: {
    profile: 'ramping_vu',
    vus: 50,
    durationSeconds: 60,
    stages: [
      { durationSeconds: 15, targetVUs: 50 },
      { durationSeconds: 30, targetVUs: 200 },
      { durationSeconds: 15, targetVUs: 0 },
    ],
    targetRps: 500,
    maxVUs: 1000,
  },
  requests: [
    {
      id: 'req_1',
      name: 'GET Production Healthcheck & Tokens',
      protocol: 'http2',
      method: 'GET',
      url: 'https://one.one.one.one',
      headers: [
        { key: 'Accept', value: 'application/json' },
        { key: 'User-Agent', value: 'Mjolnir-Enterprise-Engine/1.0' },
      ],
      queryParams: [],
      cookies: [],
      bodyType: 'none',
      auth: { type: 'none' },
      timeoutMs: 10000,
      assertions: [
        { type: 'status', expression: 'status', expected: '200' },
      ],
    },
    {
      id: 'req_2',
      name: 'POST GraphQL User Mutation Strike',
      protocol: 'http2',
      method: 'POST',
      url: 'https://one.one.one.one',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
      ],
      queryParams: [],
      cookies: [],
      bodyType: 'json',
      body: JSON.stringify({
        query: 'mutation CreateSession($id: ID!) { createSession(userId: $id) { token status } }',
        variables: { id: '{{faker.uuid}}', timestamp: '{{faker.timestamp}}' },
      }, null, 2),
      auth: { type: 'bearer', token: 'enter_your_jwt_here_12345' },
      timeoutMs: 15000,
    },
  ],
  tls: {
    insecureSkipVerify: true,
    minVersion: 'TLS1.2',
  },
  thresholds: [
    { metric: 'http_req_duration', aggregation: 'p99', operator: '<', value: 500, abortOnFail: false },
    { metric: 'http_req_failed', aggregation: 'rate', operator: '<', value: 1.0, abortOnFail: true },
  ],
  csv: {
    enabled: false,
    delimiter: ',',
    loop: true,
    variableNames: ['username', 'password', 'tenant_id'],
  },
  sshMonitoring: {
    enabled: false,
    host: 'staging-db-01.internal',
    port: 22,
    username: 'ubuntu',
    authMethod: 'password',
    pollIntervalMs: 2000,
  },
  exporters: {
    prometheus: { enabled: true, port: 9090, path: '/metrics' },
    influxdb: { enabled: false, url: 'http://localhost:8086', org: 'enterprise', bucket: 'mjolnir_telemetry', token: '' },
    datadog: { enabled: false, host: 'localhost', port: 8125, prefix: 'mjolnir.live' },
  },
  scriptMode: false,
  customTypeScript: `// Mjolnir Advanced Code Mode — Custom Script
import { http, check, sleep } from 'mjolnir';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<200'], // 99% of requests must complete below 200ms
  },
};

export default function () {
  const res = http.get('https://one.one.one.one');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
`,
};

// Zustand store with persist middleware for scenario, reports, benchmark, and workers
export const useStore = create<MjolnirState>()(
  persist(
    (set, get) => ({
      // Navigation
      activeTab: 'dashboard',
      setActiveTab: (activeTab) => set({ activeTab }),

      // Engine
      engineStatus: 'stopped',
      setEngineStatus: (engineStatus) => set({ engineStatus }),
      enginePort: 4567,
      setEnginePort: (enginePort) => set({ enginePort }),
      clusterMode: 'standalone',
      setClusterMode: (clusterMode) => set({ clusterMode }),

      // Scenario
      activeScenario: DEFAULT_SCENARIO,
      setActiveScenario: (updater) =>
        set((state) => ({
          activeScenario: typeof updater === 'function' ? updater(state.activeScenario) : updater,
        })),

      // Telemetry (NOT persisted — transient)
      liveMetrics: null,
      metricsHistory: [],
      hostStats: null,
      hostStatsHistory: [],
      addMetricsFrame: (frame) =>
        set((state) => {
          const isNewTest =
            state.liveMetrics &&
            (frame.elapsed_seconds < state.liveMetrics.elapsed_seconds ||
              frame.total_requests < state.liveMetrics.total_requests);
          const nextHistory = isNewTest
            ? [frame]
            : [...state.metricsHistory, frame].slice(-300);
          return { liveMetrics: frame, metricsHistory: nextHistory };
        }),
      addHostStatsFrame: (stats) =>
        set((state) => {
          const nextHistory = [...state.hostStatsHistory, stats].slice(-300);
          return { hostStats: stats, hostStatsHistory: nextHistory };
        }),
      clearTelemetry: () =>
        set({ liveMetrics: null, metricsHistory: [], hostStats: null, hostStatsHistory: [] }),

      // Logs (NOT persisted — transient)
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          source: 'ipc',
          message: '⚡ Mjolnir Control Plane initialized. Ready to spawn high-performance Rust core.',
        },
      ],
      addLog: (log) =>
        set((state) => {
          const cleanMessage = (log.message || '').replace(/\x1b\[[0-9;]*[a-zA-Z]|E\[[0-9;]*[a-zA-Z]/g, '');
          return {
            logs: [
              ...state.logs,
              { ...log, message: cleanMessage, timestamp: log.timestamp || new Date().toLocaleTimeString() },
            ].slice(-500),
          };
        }),
      clearLogs: () => set({ logs: [] }),

      // Log Drawer
      logDrawerOpen: false,
      setLogDrawerOpen: (logDrawerOpen) => set({ logDrawerOpen }),

      // Reports (persisted)
      pastReports: [],
      addReport: (report) =>
        set((state) => ({
          pastReports: [report as TestReportSummary, ...state.pastReports],
        })),
      clearReports: () => set({ pastReports: [] }),

      // Benchmark (persisted)
      benchmarkResult: null,
      setBenchmarkResult: (benchmarkResult) => set({ benchmarkResult }),
      isBenchmarking: false,
      setIsBenchmarking: (isBenchmarking) => set({ isBenchmarking }),

      // Distributed Workers (persisted)
      workerNodes: [],
      addWorkerNode: (node) =>
        set((state) => ({ workerNodes: [...state.workerNodes, node] })),
      removeWorkerNode: (id) =>
        set((state) => ({ workerNodes: state.workerNodes.filter((w) => w.id !== id) })),
      updateWorkerNode: (id, updates) =>
        set((state) => ({
          workerNodes: state.workerNodes.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      clearWorkerNodes: () => set({ workerNodes: [] }),
    }),
    {
      name: 'mjolnir-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist these keys — exclude transient runtime state
      partialize: (state) => ({
        activeScenario: state.activeScenario,
        enginePort: state.enginePort,
        pastReports: state.pastReports,
        benchmarkResult: state.benchmarkResult,
        workerNodes: state.workerNodes,
        clusterMode: state.clusterMode,
      }),
    }
  )
);
