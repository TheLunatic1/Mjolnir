import { ipcMain, dialog, BrowserWindow } from 'electron';
import { EngineManager } from './engineManager';
import { CsvParserBridge } from './csvParser';
import { ReportGeneratorBridge } from './reportGenerator';
import { SshMonitorBridge } from './sshMonitor';

export function setupIpcHandlers(mainWindow: BrowserWindow, engineManager: EngineManager, sshMonitor: SshMonitorBridge): void {
  ipcMain.handle('engine:start', async (_, mode) => {
    return await engineManager.startEngine(mode);
  });

  ipcMain.handle('engine:stop', async () => {
    engineManager.stopEngine();
    return { success: true };
  });

  ipcMain.handle('test:run', async (_, payload) => {
    const sent = engineManager.sendCommand({
      command: 'RunTest',
      data: { scenario_json: JSON.stringify(payload.scenario) },
    });
    return { success: sent };
  });

  ipcMain.handle('test:abort', async () => {
    const sent = engineManager.sendCommand({ command: 'AbortTest' });
    return { success: sent };
  });

  ipcMain.handle('csv:parse', async (_, { filePath, maxRows }) => {
    return await CsvParserBridge.parseCsvFile(filePath, maxRows);
  });

  ipcMain.handle('report:generateHtml', async (_, { summary, targetPath }) => {
    let finalPath = targetPath;
    if (!finalPath) {
      const res = await dialog.showSaveDialog(mainWindow, {
        title: 'Save HTML Test Report',
        defaultPath: `Mjolnir_Report_${Date.now()}.html`,
        filters: [{ name: 'HTML Document', extensions: ['html'] }],
      });
      if (res.canceled || !res.filePath) return { success: false, error: 'Cancelled' };
      finalPath = res.filePath;
    }
    return await ReportGeneratorBridge.generateHtmlReport(summary, finalPath);
  });

  ipcMain.handle('report:generatePdf', async (_, { summary, targetPath }) => {
    let finalPath = targetPath;
    if (!finalPath) {
      const res = await dialog.showSaveDialog(mainWindow, {
        title: 'Save PDF Test Report',
        defaultPath: `Mjolnir_Report_${Date.now()}.pdf`,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });
      if (res.canceled || !res.filePath) return { success: false, error: 'Cancelled' };
      finalPath = res.filePath;
    }
    return await ReportGeneratorBridge.generatePdfReport(summary, finalPath);
  });

  ipcMain.handle('ssh:monitorStart', async (_, config) => {
    return await sshMonitor.connectAndMonitor(config);
  });

  ipcMain.handle('ssh:monitorStop', async () => {
    sshMonitor.stopMonitoring();
    return { success: true };
  });

  ipcMain.handle('dialog:openFile', async (_, filters) => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return res.canceled ? null : res.filePaths[0];
  });
}
