import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { EngineManager } from './bridge/engineManager';
import { SshMonitorBridge } from './bridge/sshMonitor';
import { setupIpcHandlers } from './bridge/ipcHandlers';

let mainWindow: BrowserWindow | null = null;
let engineManager: EngineManager | null = null;
let sshMonitor: SshMonitorBridge | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090d16',
    title: 'Mjolnir — Enterprise Load Testing',
    icon: path.join(__dirname, '../resources/icon.png'),
    frame: true, // Native window frame or custom titlebar
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  engineManager = new EngineManager(mainWindow);
  sshMonitor = new SshMonitorBridge(mainWindow);
  setupIpcHandlers(mainWindow, engineManager, sshMonitor);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (engineManager) {
    engineManager.stopEngine();
  }
  if (sshMonitor) {
    sshMonitor.stopMonitoring();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (engineManager) {
    engineManager.stopEngine();
  }
  if (sshMonitor) {
    sshMonitor.stopMonitoring();
  }
});
