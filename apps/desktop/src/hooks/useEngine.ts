import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { EngineStatus } from '../types';

export function useEngine() {
  const { engineStatus, setEngineStatus, addLog, clusterMode, activeScenario, clearTelemetry, setActiveTab } = useStore();

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

  const restartEngine = useCallback(async () => {
    if (!window.mjolnir) return;
    setEngineStatus('stopping');
    await window.mjolnir.engine.stop();
    await new Promise((res) => setTimeout(res, 500));
    setEngineStatus('starting');
    const res = await window.mjolnir.engine.start(clusterMode);
    if (!res.success) {
      setEngineStatus('error');
      addLog({ level: 'error', source: 'ipc', message: `Engine restart failed: ${res.error}` });
    } else {
      addLog({ level: 'info', source: 'ipc', message: `⚡ Engine restarted successfully in ${clusterMode} mode.` });
    }
  }, [clusterMode, setEngineStatus, addLog]);

  const startTest = useCallback(async () => {
    if (!window.mjolnir) return;
    clearTelemetry();
    setActiveTab('dashboard');
    addLog({ level: 'info', source: 'ipc', message: `🚀 Launching strike: "${activeScenario.name}"` });
    await window.mjolnir.test.run(activeScenario, clusterMode);
  }, [activeScenario, clusterMode, clearTelemetry, setActiveTab, addLog]);

  const abortTest = useCallback(async () => {
    if (!window.mjolnir) return;
    addLog({ level: 'warn', source: 'ipc', message: '🛑 Sending emergency abort command to Mjolnir Core...' });
    await window.mjolnir.test.abort();
  }, [addLog]);

  return {
    engineStatus,
    startEngine,
    stopEngine,
    restartEngine,
    startTest,
    abortTest,
    isRunningTest: engineStatus === 'running',
    isEngineReady: engineStatus === 'idle' || engineStatus === 'running',
  };
}
