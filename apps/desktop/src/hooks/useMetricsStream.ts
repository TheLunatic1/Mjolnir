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
        addReport({
          id: `run_${Date.now()}`,
          timestamp: new Date().toLocaleString(),
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
