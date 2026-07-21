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

  public async startEngine(
    mode: 'standalone' | 'master' | 'worker' = 'standalone',
    port?: number
  ): Promise<{ success: boolean; port?: number; error?: string }> {
    // Use caller-supplied port, or fall back to current configured port
    if (port && port > 0) {
      this.port = port;
    }

    if (this.process && !this.process.killed) {
      return { success: true, port: this.port };
    }

    const binaryName = process.platform === 'win32' ? 'mjolnir-engine.exe' : 'mjolnir-engine';

    // Check development build path vs production resource path
    const devPath = path.resolve(__dirname, '../../../engine/target/release', binaryName);
    const prodPath = path.resolve(process.resourcesPath, 'engine', binaryName);

    const execPath = fs.existsSync(devPath)
      ? devPath
      : fs.existsSync(prodPath)
      ? prodPath
      : null;

    if (!execPath) {
      const err = `Native Mjolnir Engine binary not found at ${devPath} or ${prodPath}. Please build the Rust engine first.`;
      this.sendToRenderer('engine:log', { level: 'error', source: 'ipc', message: err });
      return { success: false, error: err };
    }

    try {
      this.sendToRenderer('engine:log', {
        level: 'info',
        source: 'ipc',
        message: `Spawning Mjolnir Native Core [${mode}] on port ${this.port}: ${execPath}`,
      });

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
        this.sendToRenderer('engine:log', {
          level: 'warn',
          source: 'ipc',
          message: `Engine process exited with code ${code}`,
        });
        this.isRunning = false;
        this.sendToRenderer('engine:status', 'stopped');
        this.cleanupWs();
      });

      // Attempt WS connection with exponential backoff retry
      const connected = await this.connectWsWithRetry(3, 600);
      if (!connected) {
        return { success: false, error: `Could not connect to engine WebSocket on port ${this.port} after 3 attempts.` };
      }

      this.isRunning = true;
      this.sendToRenderer('engine:status', 'idle');
      return { success: true, port: this.port };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Attempts WS connection with exponential backoff.
   * Returns true if connected, false after all retries exhausted.
   */
  private async connectWsWithRetry(maxRetries: number, baseDelayMs: number): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = baseDelayMs * attempt; // 600ms, 1200ms, 1800ms
      this.sendToRenderer('engine:log', {
        level: 'info',
        source: 'ipc',
        message: `Waiting ${delay}ms for engine to bind port ${this.port} (attempt ${attempt}/${maxRetries})...`,
      });
      await new Promise((res) => setTimeout(res, delay));

      const ok = await this.connectWs();
      if (ok) return true;
    }
    return false;
  }

  private connectWs(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.cleanupWs();
        this.ws = new WebSocket(`ws://127.0.0.1:${this.port}/ws`);

        const timeout = setTimeout(() => {
          resolve(false);
          this.cleanupWs();
        }, 3000);

        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.sendToRenderer('engine:log', {
            level: 'info',
            source: 'ipc',
            message: `IPC WebSocket connected to native binary on port ${this.port}.`,
          });
          resolve(true);
        });

        this.ws.on('message', (data) => {
          try {
            const raw = data.toString();
            const event = JSON.parse(raw);
            console.log('[EngineManager] WS event received:', event.event, JSON.stringify(event.payload).substring(0, 120));
            if (event.event === 'MetricsFrame') {
              const frame = event.payload?.frame ?? event.payload;
              console.log('[EngineManager] Forwarding MetricsFrame to renderer, current_vus:', frame?.current_vus, 'total_requests:', frame?.total_requests);
              this.sendToRenderer('metrics:frame', frame);
            } else if (event.event === 'StatusChanged') {
              this.sendToRenderer('engine:status', event.payload.state);
            } else if (event.event === 'TestCompleted') {
              this.sendToRenderer('test:completed', event.payload.summary_json);
            } else if (event.event === 'LogMessage') {
              this.sendToRenderer('engine:log', event.payload);
            } else if (event.event === 'Error') {
              this.sendToRenderer('engine:log', {
                level: 'error',
                source: 'engine',
                message: event.payload.message,
              });
            }
          } catch (e) {
            console.error('Failed to parse WS event:', e);
          }
        });

        this.ws.on('error', (e) => {
          clearTimeout(timeout);
          this.sendToRenderer('engine:log', {
            level: 'warn',
            source: 'ipc',
            message: `WS connection attempt failed: ${e.message}`,
          });
          resolve(false);
        });
      } catch {
        resolve(false);
      }
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
      this.sendToRenderer('engine:log', {
        level: 'info',
        source: 'ipc',
        message: 'Terminating Mjolnir Native Core...',
      });
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.cleanupWs();
    this.isRunning = false;
    this.sendToRenderer('engine:status', 'stopped');
  }

  private cleanupWs(): void {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}
