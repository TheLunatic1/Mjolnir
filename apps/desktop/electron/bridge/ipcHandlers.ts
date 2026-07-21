import { ipcMain, dialog, BrowserWindow } from 'electron';
import { EngineManager } from './engineManager';
import { CsvParserBridge } from './csvParser';
import { ReportGeneratorBridge } from './reportGenerator';
import { getSystemInfo } from './systemInfo';
import { runBenchmark, cancelBenchmark } from './benchmarkRunner';

export function setupIpcHandlers(mainWindow: BrowserWindow, engineManager: EngineManager): void {
  // ── Engine Control ──────────────────────────────────────────────────────
  ipcMain.handle('engine:start', async (_, mode, port?: number) => {
    return await engineManager.startEngine(mode, port);
  });

  ipcMain.handle('engine:stop', async () => {
    engineManager.stopEngine();
    return { success: true };
  });

  // ── Test Control ────────────────────────────────────────────────────────
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

  // ── CSV ─────────────────────────────────────────────────────────────────
  ipcMain.handle('csv:parse', async (_, { filePath, maxRows }) => {
    return await CsvParserBridge.parseCsvFile(filePath, maxRows);
  });

  // ── Reports ─────────────────────────────────────────────────────────────
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

  // ── System Info ──────────────────────────────────────────────────────────
  ipcMain.handle('system:getInfo', async () => {
    try {
      const info = getSystemInfo();
      return { success: true, data: info };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // ── Benchmark ────────────────────────────────────────────────────────────
  ipcMain.handle('benchmark:run', async (_, { testTarget }) => {
    try {
      const result = await runBenchmark(testTarget, (phase) => {
        // Send progress updates to renderer in real-time
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('benchmark:progress', phase);
        }
      });
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('benchmark:cancel', async () => {
    cancelBenchmark();
    return { success: true };
  });

  // ── Dialog ───────────────────────────────────────────────────────────────
  ipcMain.handle('dialog:openFile', async (_, filters) => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle('dialog:saveJson', async (_, { defaultName }) => {
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Scenario',
      defaultPath: defaultName || 'mjolnir-scenario.json',
      filters: [{ name: 'JSON Scenario', extensions: ['json'] }],
    });
    return res.canceled ? null : res.filePath;
  });

  ipcMain.handle('dialog:openJson', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'JSON Scenario', extensions: ['json'] }],
    });
    return res.canceled ? null : res.filePaths[0];
  });
}
