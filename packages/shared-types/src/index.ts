// ==========================================
// Mjolnir Enterprise Load Testing - Shared Types
// ==========================================

export type ProtocolType = 
  | 'http1' 
  | 'http2' 
  | 'http3' 
  | 'websocket' 
  | 'grpc' 
  | 'graphql' 
  | 'tcp' 
  | 'udp' 
  | 'mqtt' 
  | 'smtp' 
  | 'imap';

export type ExecutionProfileType = 
  | 'constant_vu' 
  | 'ramping_vu' 
  | 'constant_arrival_rate' 
  | 'spike' 
  | 'soak';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'api_key';
  username?: string;
  password?: string;
  token?: string;
  apiKeyHeader?: string;
  apiKeyValue?: string;
}

export interface TlsConfig {
  insecureSkipVerify: boolean;
  customCertPath?: string;
  clientCertPath?: string;
  clientKeyPath?: string;
  minVersion?: 'TLS1.2' | 'TLS1.3';
}

export interface RequestSpec {
  id: string;
  name: string;
  protocol: ProtocolType;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  cookies: KeyValuePair[];
  bodyType: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'graphql' | 'grpc' | 'binary';
  body?: string;
  auth: AuthConfig;
  timeoutMs: number;
  extractors?: {
    name: string;
    type: 'jsonpath' | 'regex' | 'header';
    expression: string;
  }[];
  assertions?: {
    type: 'status' | 'body_contains' | 'jsonpath_equals' | 'response_time';
    expression: string;
    expected: string;
  }[];
}

export interface Stage {
  durationSeconds: number;
  targetVUs?: number;
  targetRps?: number;
}

export interface ExecutionConfig {
  profile: ExecutionProfileType;
  // For constant_vu & soak
  vus?: number;
  durationSeconds?: number;
  // For ramping_vu & spike
  stages?: Stage[];
  // For constant_arrival_rate
  targetRps?: number;
  maxVUs?: number;
}

export interface ThresholdRule {
  metric: 'http_req_duration' | 'http_req_failed' | 'http_req_succeeded' | 'ttfb' | 'dns' | 'tcp' | 'tls' | 'rps' | 'bandwidth';
  aggregation: 'p50' | 'p90' | 'p95' | 'p99' | 'p999' | 'avg' | 'max' | 'rate' | 'count';
  operator: '<' | '<=' | '>' | '>=' | '==';
  value: number;
  abortOnFail?: boolean;
}

export interface CsvParameterConfig {
  enabled: boolean;
  filePath?: string;
  delimiter?: string;
  loop?: boolean;
  variableNames?: string[];
}

export interface SshMonitoringConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'privateKey';
  password?: string;
  privateKeyPath?: string;
  pollIntervalMs: number;
}

export interface TelemetryExporterConfig {
  prometheus: { enabled: boolean; port: number; path: string };
  influxdb: { enabled: boolean; url: string; org: string; bucket: string; token: string };
  datadog: { enabled: boolean; host: string; port: number; prefix: string };
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  execution: ExecutionConfig;
  requests: RequestSpec[];
  tls: TlsConfig;
  thresholds: ThresholdRule[];
  csv: CsvParameterConfig;
  sshMonitoring: SshMonitoringConfig;
  exporters: TelemetryExporterConfig;
  scriptMode?: boolean;
  customTypeScript?: string;
}

// ==========================================
// Live Metrics & Telemetry Frames
// ==========================================

export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
  avg: number;
  min: number;
  max: number;
}

export interface MicrosecondMetrics {
  dnsResolution: LatencyPercentiles;
  tcpConnect: LatencyPercentiles;
  tlsHandshake: LatencyPercentiles;
  ttfb: LatencyPercentiles;
  totalDuration: LatencyPercentiles;
}

export interface HostStatsFrame {
  timestamp: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  diskIoReadKbps: number;
  diskIoWriteKbps: number;
  networkRxKbps: number;
  networkTxKbps: number;
}

export interface LiveMetricsFrame {
  timestamp: number;
  elapsedSeconds: number;
  currentVUs: number;
  currentRps: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  bandwidthInBytesPerSec: number;
  bandwidthOutBytesPerSec: number;
  latencies: MicrosecondMetrics;
  hostStats?: HostStatsFrame;
  thresholdResults: {
    rule: string;
    passed: boolean;
    currentValue: number;
  }[];
}

export interface EngineLogMessage {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'engine' | 'ipc' | 'ssh' | 'exporter';
  message: string;
}

export type EngineStatus = 'stopped' | 'starting' | 'idle' | 'running' | 'stopping' | 'error';

// ==========================================
// IPC Command & Event Payloads
// ==========================================

export interface IpcEngineStartResponse {
  success: boolean;
  wsPort?: number;
  pid?: number;
  error?: string;
}

export interface IpcRunTestRequest {
  scenario: TestScenario;
  mode: 'standalone' | 'master' | 'worker';
  workerNodes?: string[]; // WebSocket URLs of worker nodes
}

export interface IpcRunTestResponse {
  success: boolean;
  testId?: string;
  error?: string;
}

export interface TestReportSummary {
  testId: string;
  scenarioName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  peakRps: number;
  averageRps: number;
  latencies: MicrosecondMetrics;
  thresholdsPassed: boolean;
  failedThresholds: string[];
}
