import { create } from 'zustand';
import type {
  EngineStatus,
  EngineLogMessage,
  LiveMetricsFrame,
  HostStatsFrame,
  TestScenario,
  NavTab,
} from '../types';

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
  metricsHistory: LiveMetricsFrame[]; // Ring buffer up to 300 points (2.5 mins @ 500ms)
  hostStats: HostStatsFrame | null;
  hostStatsHistory: HostStatsFrame[];
  addMetricsFrame: (frame: LiveMetricsFrame) => void;
  addHostStatsFrame: (stats: HostStatsFrame) => void;
  clearTelemetry: () => void;

  // Logs
  logs: EngineLogMessage[];
  addLog: (log: EngineLogMessage) => void;
  clearLogs: () => void;

  // Past Test Reports
  pastReports: any[];
  addReport: (report: any) => void;
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
      url: 'https://httpbin.org/get?user={{faker.name}}&id={{faker.uuid}}',
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
      url: 'https://httpbin.org/post',
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
  const res = http.get('https://httpbin.org/json');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has slideshow data': (r) => r.json().slideshow !== undefined,
  });
  sleep(1);
}
`,
};

export const useStore = create<MjolnirState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (activeTab) => set({ activeTab }),

  engineStatus: 'stopped',
  setEngineStatus: (engineStatus) => set({ engineStatus }),
  enginePort: 4567,
  setEnginePort: (enginePort) => set({ enginePort }),
  clusterMode: 'standalone',
  setClusterMode: (clusterMode) => set({ clusterMode }),

  activeScenario: DEFAULT_SCENARIO,
  setActiveScenario: (updater) =>
    set((state) => ({
      activeScenario: typeof updater === 'function' ? updater(state.activeScenario) : updater,
    })),

  liveMetrics: null,
  metricsHistory: [],
  hostStats: null,
  hostStatsHistory: [],
  addMetricsFrame: (frame) =>
    set((state) => {
      const nextHistory = [...state.metricsHistory, frame].slice(-300); // Keep last 300 frames
      return { liveMetrics: frame, metricsHistory: nextHistory };
    }),
  addHostStatsFrame: (stats) =>
    set((state) => {
      const nextHistory = [...state.hostStatsHistory, stats].slice(-300);
      return { hostStats: stats, hostStatsHistory: nextHistory };
    }),
  clearTelemetry: () => set({ liveMetrics: null, metricsHistory: [], hostStats: null, hostStatsHistory: [] }),

  logs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      source: 'ipc',
      message: '⚡ Mjolnir Control Plane initialized. Ready to spawn high-performance Rust core.',
    },
  ],
  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, { ...log, timestamp: log.timestamp || new Date().toLocaleTimeString() }].slice(-500),
    })),
  clearLogs: () => set({ logs: [] }),

  pastReports: [],
  addReport: (report) =>
    set((state) => ({
      pastReports: [report, ...state.pastReports],
    })),
}));
