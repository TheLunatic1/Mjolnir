import { contextBridge, ipcRenderer } from 'electron';

const mjolnirApi = {
  engine: {
    start: (mode?: 'standalone' | 'master' | 'worker', port?: number) =>
      ipcRenderer.invoke('engine:start', mode, port),
    stop: () => ipcRenderer.invoke('engine:stop'),
    onStatusChange: (callback: (status: string) => void) => {
      const handler = (_: any, status: string) => callback(status);
      ipcRenderer.on('engine:status', handler);
      return () => ipcRenderer.removeListener('engine:status', handler);
    },
    onLog: (callback: (log: { level: string; source: string; message: string }) => void) => {
      const handler = (_: any, log: any) => callback(log);
      ipcRenderer.on('engine:log', handler);
      return () => ipcRenderer.removeListener('engine:log', handler);
    },
  },
  test: {
    run: (scenario: any, mode?: string) => ipcRenderer.invoke('test:run', { scenario, mode }),
    abort: () => ipcRenderer.invoke('test:abort'),
    onMetricsFrame: (callback: (frame: any) => void) => {
      const handler = (_: any, frame: any) => callback(frame);
      ipcRenderer.on('metrics:frame', handler);
      return () => ipcRenderer.removeListener('metrics:frame', handler);
    },
    onCompleted: (callback: (summaryJson: string) => void) => {
      const handler = (_: any, summaryJson: string) => callback(summaryJson);
      ipcRenderer.on('test:completed', handler);
      return () => ipcRenderer.removeListener('test:completed', handler);
    },
  },
  csv: {
    parse: (filePath: string, maxRows?: number) =>
      ipcRenderer.invoke('csv:parse', { filePath, maxRows }),
  },
  reports: {
    generateHtml: (summary: any, targetPath?: string) =>
      ipcRenderer.invoke('report:generateHtml', { summary, targetPath }),
    generatePdf: (summary: any, targetPath?: string) =>
      ipcRenderer.invoke('report:generatePdf', { summary, targetPath }),
  },
  ssh: {
    start: (config: any) => ipcRenderer.invoke('ssh:monitorStart', config),
    stop: () => ipcRenderer.invoke('ssh:monitorStop'),
    onStats: (callback: (stats: any) => void) => {
      const handler = (_: any, stats: any) => callback(stats);
      ipcRenderer.on('ssh:stats', handler);
      return () => ipcRenderer.removeListener('ssh:stats', handler);
    },
    onError: (callback: (error: string) => void) => {
      const handler = (_: any, error: string) => callback(error);
      ipcRenderer.on('ssh:error', handler);
      return () => ipcRenderer.removeListener('ssh:error', handler);
    },
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
  },
  benchmark: {
    run: (testTarget: string) => ipcRenderer.invoke('benchmark:run', { testTarget }),
    cancel: () => ipcRenderer.invoke('benchmark:cancel'),
    onProgress: (callback: (phase: any) => void) => {
      const handler = (_: any, phase: any) => callback(phase);
      ipcRenderer.on('benchmark:progress', handler);
      return () => ipcRenderer.removeListener('benchmark:progress', handler);
    },
  },
  dialog: {
    openFile: (filters?: { name: string; extensions: string[] }[]) =>
      ipcRenderer.invoke('dialog:openFile', filters),
    saveJson: (defaultName?: string) => ipcRenderer.invoke('dialog:saveJson', { defaultName }),
    openJson: () => ipcRenderer.invoke('dialog:openJson'),
  },
};

contextBridge.exposeInMainWorld('mjolnir', mjolnirApi);

export type MjolnirApi = typeof mjolnirApi;
