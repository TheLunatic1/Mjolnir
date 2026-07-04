import { useEffect } from 'react';
import { useStore } from '../store';

export function useMetricsStream() {
  const { addMetricsFrame, addHostStatsFrame, addLog, addReport, setEngineStatus } = useStore();

  useEffect(() => {
    if (!window.mjolnir) return;

    const unsubMetrics = window.mjolnir.test.onMetricsFrame((frame: any) => {
      addMetricsFrame(frame);
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
        addLog({ level: 'info', source: 'engine', message: '🎉 Load test completed! Report saved to history.' });
      } catch (e) {
        console.error('Failed to parse completed test summary:', e);
      }
    });

    const unsubSsh = window.mjolnir.ssh.onStats((stats: any) => {
      addHostStatsFrame(stats);
    });

    return () => {
      unsubMetrics();
      unsubCompleted();
      unsubSsh();
    };
  }, [addMetricsFrame, addHostStatsFrame, addLog, addReport]);
}
