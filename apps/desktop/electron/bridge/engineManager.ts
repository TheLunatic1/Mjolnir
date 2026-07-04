import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import WebSocket from 'ws';

export class EngineManager {
  private process: ChildProcess | null = null;
  private ws: WebSocket | null = null;
  private port: number = 4567;
  private isRunning: boolean = false;

  constructor(private mainWindow: BrowserWindow) {}

  public async startEngine(mode: 'standalone' | 'master' | 'worker' = 'standalone'): Promise<{ success: boolean; port?: number; error?: string }> {
    if (this.process && !this.process.killed) {
      return { success: true, port: this.port };
    }

    const binaryName = process.platform === 'win32' ? 'mjolnir-engine.exe' : 'mjolnir-engine';
    
    // Check development build path vs production resource path
    const devPath = path.resolve(__dirname, '../../../engine/target/release', binaryName);
    const prodPath = path.resolve(process.resourcesPath, 'engine', binaryName);
    
    const execPath = fs.existsSync(devPath) ? devPath : (fs.existsSync(prodPath) ? prodPath : null);

    if (!execPath) {
      const err = `Native Mjolnir Engine binary not found at ${devPath} or ${prodPath}. Please build the Rust engine first.`;
      this.sendToRenderer('engine:log', { level: 'error', source: 'ipc', message: err });
      return { success: false, error: err };
    }

    try {
      this.sendToRenderer('engine:log', { level: 'info', source: 'ipc', message: `Spawning Mjolnir Native Core [${mode}]: ${execPath}` });
      
      this.process = spawn(execPath, ['--port', this.port.toString(), '--mode', mode], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) this.sendToRenderer('engine:log', { level: 'info', source: 'engine', message: msg });
      });

      this.process.stderr?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) this.sendToRenderer('engine:log', { level: 'warn', source: 'engine', message: msg });
      });

      this.process.on('close', (code) => {
        this.sendToRenderer('engine:log', { level: 'warn', source: 'ipc', message: `Engine process exited with code ${code}` });
        this.isRunning = false;
        this.sendToRenderer('engine:status', 'stopped');
        this.cleanupWs();
      });

      // Wait 1 second for Axum WS server to bind
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.connectWs();

      this.isRunning = true;
      this.sendToRenderer('engine:status', 'idle');
      return { success: true, port: this.port };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  private async connectWs(): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws`);

      this.ws.on('open', () => {
        this.sendToRenderer('engine:log', { level: 'info', source: 'ipc', message: 'IPC WebSocket connected to native binary.' });
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString());
          if (event.event === 'MetricsFrame') {
            this.sendToRenderer('metrics:frame', event.payload.frame);
          } else if (event.event === 'StatusChanged') {
            this.sendToRenderer('engine:status', event.payload.state);
          } else if (event.event === 'TestCompleted') {
            this.sendToRenderer('test:completed', event.payload.summary_json);
          } else if (event.event === 'LogMessage') {
            this.sendToRenderer('engine:log', event.payload);
          } else if (event.event === 'Error') {
            this.sendToRenderer('engine:log', { level: 'error', source: 'engine', message: event.payload.message });
          }
        } catch (e) {
          console.error('Failed to parse WS event:', e);
        }
      });

      this.ws.on('error', (e) => {
        this.sendToRenderer('engine:log', { level: 'error', source: 'ipc', message: `WS error: ${e.message}` });
      });
    });
  }

  public sendCommand(cmd: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(cmd));
      return true;
    }
    return false;
  }

  public stopEngine(): void {
    if (this.process && !this.process.killed) {
      this.sendToRenderer('engine:log', { level: 'info', source: 'ipc', message: 'Terminating Mjolnir Native Core...' });
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.cleanupWs();
    this.isRunning = false;
    this.sendToRenderer('engine:status', 'stopped');
  }

  private cleanupWs(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}
