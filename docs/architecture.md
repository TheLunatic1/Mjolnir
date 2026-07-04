# Mjolnir — Enterprise Load & Stress Testing Architecture Guide

## 1. Executive Summary & Design Vision

**Mjolnir** is the ultimate enterprise-grade desktop load and stress-testing platform. Engineered to match and exceed the capabilities of tools like k6, Apache JMeter, Locust, and Vegeta, Mjolnir solves the traditional tradeoff between rich visual user interfaces and high-concurrency throughput.

By decoupling the **Control Plane** (Electron / Next.js / React) from the **Execution Core** (Rust Native Async Engine), Mjolnir achieves:
- **Massive Concurrency:** Sub-millisecond async task scheduling capable of driving 100,000+ concurrent virtual users (VUs) per node without garbage collection pauses.
- **Buttery-Smooth UI:** 60fps Canvas/WebGL telemetry charts that never stutter or lag, even when ingesting tens of thousands of metric samples per second.
- **Universal Multi-Protocol Support:** Native testing across HTTP/1.1, HTTP/2, HTTP/3 (QUIC), WebSockets, gRPC, GraphQL, TCP, UDP, MQTT, and SMTP/IMAP.
- **Hybrid Scripting & Visual Workflow:** Drag-and-drop workflow builder combined with an embedded Monaco code editor executing ES6+ TypeScript/JavaScript inside the native engine.

---

## 2. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                        MJOLNIR DESKTOP CONTROL PLANE                              |
|                          (Electron + React + Tailwind)                            |
|                                                                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Visual Drag & Drop |  | Monaco Code Editor |  |  60fps Canvas Charting      |  |
|  |  Workflow Builder  |  |   (TS / ES6+)      |  |  (uPlot / Chart.js Canvas)  |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|                                     |                                             |
|                             Electron IPC / Context Bridge                         |
+-------------------------------------|---------------------------------------------+
                                      | WebSocket Stream (ws://127.0.0.1:4567)
                                      v
+-----------------------------------------------------------------------------------+
|                        MJOLNIR RUST HIGH-PERFORMANCE CORE                         |
|                            (Tokio + Axum + HdrHistogram)                          |
|                                                                                   |
|  +-----------------------+  +------------------------+  +----------------------+  |
|  |  Execution Profiles   |  |   Protocol Clients     |  | Telemetry Aggregator |  |
|  |  - Constant VUs       |  |   - HTTP/1.1, 2, 3     |  | - Lock-free Channels |  |
|  |  - Ramping VUs        |  |   - WebSockets, gRPC   |  | - HdrHistogram (P99) |  |
|  |  - Arrival Rate       |  |   - GraphQL, MQTT      |  | - Live 500ms Frames  |  |
|  |  - Spike / Soak       |  |   - TCP / UDP / SMTP   |  | - SLA Rule Assertions|  |
|  +-----------------------+  +------------------------+  +----------------------+  |
+-----------------------------------------------------------------------------------+
                                      |
               +----------------------+----------------------+
               |                      |                      |
               v                      v                      v
      +-----------------+    +-----------------+    +-----------------+
      |  Remote Target  |    | Remote Cloud    |    | External Metrics|
      |  SSH Monitoring |    | Worker Daemons  |    | Exporters       |
      |  (CPU/RAM/Disk) |    | (Master/Worker) |    | (Prom/Influx/DD)|
      +-----------------+    +-----------------+    +-----------------+
```

---

## 3. Core Component Deep-Dive

### 3.1 The Rust Execution Engine (`engine/`)
The native engine is written in **Rust 2021** using the **Tokio** multi-threaded async runtime.
- **Lock-Free Telemetry Channel:** Each worker task emits `RequestSample` data over a `tokio::sync::mpsc::unbounded_channel`. A background collector aggregates metrics into an `HdrHistogram` to compute nanosecond-accurate percentiles (p50, p90, p95, p99, p99.9, max) without locking load-generating threads.
- **Execution Profiles (`src/executor/`):** Implements exact mathematical scheduling algorithms for constant VU loops, linear ramping stages, open-loop constant arrival rate, sudden spike strikes, and endurance soak runs.
- **Embedded Scripting (`src/scripting/`):** Features a lightweight Javascript runtime allowing execution of user scripts with custom assertion rules (`check()`), dynamic pauses (`sleep()`), and variable extraction.

### 3.2 The IPC Communication Layer
To avoid serialization overhead and UI freezing during intense stress tests, Mjolnir uses a local **WebSocket loopback server (`axum`)** bound to port `4567`:
- **Command Dispatch:** The React UI sends structured JSON commands (`RunTest`, `AbortTest`) over the WebSocket connection.
- **Streamed Telemetry Frames:** The Rust engine broadcasts `LiveMetricsFrame` updates at a throttled rate of **2 Hz (every 500ms)**. This ensures the React store receives a steady, predictable flow of summarized telemetry rather than millions of raw request events.

### 3.3 The React Control Plane (`apps/desktop/`)
Built with **Vite**, **React 18**, **TypeScript**, and **Tailwind CSS v3**:
- **Design System:** Dark glassmorphism, vibrant neon gradients (Cyan `#00f2fe`, Emerald `#10b981`, Rose `#f43f5e`), modern Outfit & Inter typography, and micro-pulse indicators.
- **60fps Canvas Charts:** All live dashboard charts use HTML5 Canvas rendering with animations disabled and point radius set to 0. This guarantees zero DOM node bloat and steady 60fps framerates even during overnight soak tests.
- **Agentless SSH Monitor:** Uses Node.js `ssh2` within the Electron main process to poll target Linux servers for `/proc/stat` and `/proc/meminfo` metrics, correlating client-side latency spikes with server CPU/RAM exhaustion.

---

## 4. Distributed Cluster Architecture (`src/distributed/` & `proto/`)
For massive scale-out load testing across AWS, GCP, or Azure regions, Mjolnir supports synchronous Master/Worker clustering:
1. **Worker Daemons:** Remote Mjolnir binaries started with `--mode worker` bind to their assigned network port and wait for control plane registration.
2. **Master Orchestrator:** The desktop control plane (or CLI master) connects to worker daemons, registers their available CPU cores, and distributes scenario strikes proportionately.
3. **Aggregated Reporting:** Workers stream partial `TelemetryFrame` structures back to the master, which unifies them into a single global metrics stream presented in the dashboard.

---

## 5. Build & Verification Instructions

### Building the Native Rust Engine
```powershell
./scripts/build-engine.ps1
```
This compiles `mjolnir-engine.exe` in `--release` mode with optimizations enabled and copies it to `apps/desktop/resources/engine/`.

### Running in Development Mode
```powershell
./scripts/dev.ps1
```
This starts the Vite hot-module replacement server alongside Electron and initializes the native IPC bridge.

### Packaging Production Release
```powershell
./scripts/package-release.ps1
```
Generates production NSIS Windows installers, portable zip bundles, macOS DMGs, and Linux AppImages under `apps/desktop/release/`.
