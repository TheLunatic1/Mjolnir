// Re-export all shared types for renderer usage — using the actual names from shared-types
export type {
  ProtocolType,
  ExecutionProfileType,
  KeyValuePair,
  AuthConfig,
  TlsConfig,
  RequestSpec,
  Stage,
  ExecutionConfig,
  ThresholdRule,
  CsvParameterConfig,
  SshMonitoringConfig,
  TelemetryExporterConfig,
  TestScenario,
  LatencyPercentiles,
  MicrosecondMetrics,
  HostStatsFrame,
  LiveMetricsFrame,
  EngineLogMessage,
  EngineStatus,
  IpcEngineStartResponse,
  IpcRunTestRequest,
  IpcRunTestResponse,
  TestReportSummary,
  SystemInfo,
  NetworkInterface,
  BenchmarkTier,
  BenchmarkPhaseResult,
  BenchmarkResult,
  WorkerStatus,
  WorkerNode,
} from '@mjolnir/shared-types';

export type NavTab =
  | 'dashboard'
  | 'builder'
  | 'editor'
  | 'monitoring'
  | 'distributed'
  | 'benchmark'
  | 'settings'
  | 'reports';

// MjolnirApi type declaration (runtime object exposed by preload)
import type { MjolnirApi } from '../../electron/preload';

declare global {
  interface Window {
    mjolnir: MjolnirApi;
  }
}
