import { useEffect } from 'react';
import { useStore } from '../store';

export function useMetricsStream() {
  const { addMetricsFrame, addLog, addReport, setEngineStatus } = useStore();

  useEffect(() => {
    if (!window.mjolnir) return;

    const unsubMetrics = window.mjolnir.test.onMetricsFrame((frame: any) => {
      console.log('[useMetricsStream] MetricsFrame received:', frame?.current_vus, 'RPS:', frame?.current_rps, 'Total:', frame?.total_requests);
      // Ensure engine is marked as running when frames arrive
      setEngineStatus('running');
      const normalized = {
        ...frame,
        elapsedSeconds: frame.elapsed_seconds ?? frame.elapsedSeconds ?? 0,
        elapsed_seconds: frame.elapsed_seconds ?? frame.elapsedSeconds ?? 0,
        currentVUs: frame.current_vus ?? frame.currentVUs ?? 0,
        current_vus: frame.current_vus ?? frame.currentVUs ?? 0,
        currentRps: frame.current_rps ?? frame.currentRps ?? 0,
        current_rps: frame.current_rps ?? frame.currentRps ?? 0,
        totalRequests: frame.total_requests ?? frame.totalRequests ?? 0,
        total_requests: frame.total_requests ?? frame.totalRequests ?? 0,
        successfulRequests: frame.successful_requests ?? frame.successfulRequests ?? 0,
        successful_requests: frame.successful_requests ?? frame.successfulRequests ?? 0,
        failedRequests: frame.failed_requests ?? frame.failedRequests ?? 0,
        failed_requests: frame.failed_requests ?? frame.failedRequests ?? 0,
        errorRate: frame.error_rate ?? frame.errorRate ?? 0,
        error_rate: frame.error_rate ?? frame.errorRate ?? 0,
        bandwidthInBytesPerSec: frame.bandwidth_in_bytes_per_sec ?? frame.bandwidthInBytesPerSec ?? 0,
        bandwidth_in_bytes_per_sec: frame.bandwidth_in_bytes_per_sec ?? frame.bandwidthInBytesPerSec ?? 0,
        bandwidthOutBytesPerSec: frame.bandwidth_out_bytes_per_sec ?? frame.bandwidthOutBytesPerSec ?? 0,
        bandwidth_out_bytes_per_sec: frame.bandwidth_out_bytes_per_sec ?? frame.bandwidthOutBytesPerSec ?? 0,
        latencies: frame.latencies ? {
          ...frame.latencies,
          totalDuration: frame.latencies.total_duration ?? frame.latencies.totalDuration,
          total_duration: frame.latencies.total_duration ?? frame.latencies.totalDuration,
          ttfb: frame.latencies.ttfb,
          dnsResolution: frame.latencies.dns_resolution ?? frame.latencies.dnsResolution,
          dns_resolution: frame.latencies.dns_resolution ?? frame.latencies.dnsResolution,
          tcpConnect: frame.latencies.tcp_connect ?? frame.latencies.tcpConnect,
          tcp_connect: frame.latencies.tcp_connect ?? frame.latencies.tcpConnect,
          tlsHandshake: frame.latencies.tls_handshake ?? frame.latencies.tlsHandshake,
          tls_handshake: frame.latencies.tls_handshake ?? frame.latencies.tlsHandshake,
        } : undefined,
      };
      addMetricsFrame(normalized);
    });

    const unsubCompleted = window.mjolnir.test.onCompleted((summaryJson: string) => {
      try {
        const summary = JSON.parse(summaryJson);
        const state = useStore.getState();
        const live = state.liveMetrics;
        const hist = state.metricsHistory;
        const peakRps = Math.max(...hist.map((m: any) => m.current_rps || m.currentRps || 0), (live as any)?.current_rps || (live as any)?.currentRps || 0, 0);

        addReport({
          id: `run_${Date.now()}`,
          scenarioName: state.activeScenario?.name || 'Enterprise Strike Run',
          timestamp: new Date().toLocaleString(),
          totalRequests: (live as any)?.total_requests || (live as any)?.totalRequests || summary.totalRequests || 0,
          successfulRequests: (live as any)?.successful_requests || (live as any)?.successfulRequests || summary.successfulRequests || 0,
          failedRequests: (live as any)?.failed_requests || (live as any)?.failedRequests || summary.failedRequests || 0,
          peakRps: Math.round(peakRps || summary.peakRps || 0),
          latencies: {
            total_duration: (live as any)?.latencies?.total_duration || (live as any)?.latencies?.totalDuration || { p50: 0, p90: 0, p95: 0, p99: 0, max: 0 },
            totalDuration: (live as any)?.latencies?.total_duration || (live as any)?.latencies?.totalDuration || { p50: 0, p90: 0, p95: 0, p99: 0, max: 0 },
          },
          ...summary,
        });
        if (live) {
          addMetricsFrame({
            ...live,
            currentVUs: 0,
            current_vus: 0,
            currentRps: 0,
            current_rps: 0,
            bandwidthInBytesPerSec: 0,
            bandwidth_in_bytes_per_sec: 0,
            bandwidthOutBytesPerSec: 0,
            bandwidth_out_bytes_per_sec: 0,
          });
        }
        addLog({ level: 'info', source: 'engine', message: '🎉 Load test completed! Report saved to history.' });
      } catch (e) {
        console.error('Failed to parse completed test summary:', e);
      }
    });

    return () => {
      unsubMetrics();
      unsubCompleted();
    };
  }, [addMetricsFrame, addLog, addReport, setEngineStatus]);
}

