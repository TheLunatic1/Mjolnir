import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { EngineStatus } from '../types';

export function useEngine() {
  const { engineStatus, setEngineStatus, addLog, clusterMode, activeScenario, clearTelemetry } = useStore();

  useEffect(() => {
    if (!window.mjolnir) return;

    const unsubStatus = window.mjolnir.engine.onStatusChange((status: string) => {
      setEngineStatus(status as EngineStatus);
    });

    const unsubLog = window.mjolnir.engine.onLog((log: any) => {
      addLog(log);
    });

    return () => {
      unsubStatus();
      unsubLog();
    };
  }, [setEngineStatus, addLog]);

  const startEngine = useCallback(async () => {
    if (!window.mjolnir) return;
    setEngineStatus('starting');
    const res = await window.mjolnir.engine.start(clusterMode);
    if (!res.success) {
      setEngineStatus('error');
      addLog({ level: 'error', source: 'ipc', message: `Engine start failed: ${res.error}` });
    }
  }, [clusterMode, setEngineStatus, addLog]);

  const stopEngine = useCallback(async () => {
    if (!window.mjolnir) return;
    setEngineStatus('stopping');
    await window.mjolnir.engine.stop();
  }, [setEngineStatus]);

  const startTest = useCallback(async () => {
    if (!window.mjolnir) return;
    clearTelemetry();
    addLog({ level: 'info', source: 'ipc', message: `🚀 Launching strike: "${activeScenario.name}"` });
    await window.mjolnir.test.run(activeScenario, clusterMode);
  }, [activeScenario, clusterMode, clearTelemetry, addLog]);

  const abortTest = useCallback(async () => {
    if (!window.mjolnir) return;
    addLog({ level: 'warn', source: 'ipc', message: '🛑 Sending emergency abort command to Mjolnir Core...' });
    await window.mjolnir.test.abort();
  }, [addLog]);

  return {
    engineStatus,
    startEngine,
    stopEngine,
    startTest,
    abortTest,
    isRunningTest: engineStatus === 'running',
    isEngineReady: engineStatus === 'idle' || engineStatus === 'running',
  };
}
