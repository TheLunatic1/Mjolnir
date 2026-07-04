# ⚡ MJOLNIR — The Ultimate Enterprise Load & Stress Testing Handbook

> **An exhaustive, handbook-style operational guide for mastering the Mjolnir Enterprise Load Testing Platform.**
> **Created by:** **TheLunatic1 (Salman Toha)**  
> **License:** Apache License 2.0

---

## 📖 Table of Contents

1. [Executive Summary & Capabilities](#1-executive-summary--capabilities)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Installation & Getting Started](#3-installation--getting-started)
4. [The Control Plane UI Navigation](#4-the-control-plane-ui-navigation)
5. [Visual Script Builder (No-Code Testing)](#5-visual-script-builder-no-code-testing)
6. [Code Mode (Embedded JS/TS Runtime)](#6-code-mode-embedded-jsts-runtime)
7. [Execution Load Profiles](#7-execution-load-profiles)
8. [Protocol Capabilities (HTTP/1.1, HTTP/2, HTTP/3, WebSockets)](#8-protocol-capabilities)
9. [Distributed Cloud Cluster Orchestration](#9-distributed-cloud-cluster-orchestration)
10. [Host SSH Infrastructure Monitoring](#10-host-ssh-infrastructure-monitoring)
11. [Telemetry Exporters (InfluxDB & Datadog)](#11-telemetry-exporters-influxdb--datadog)
12. [Reports, Analytics & Data Export](#12-reports-analytics--data-export)
13. [Troubleshooting & Best Practices](#13-troubleshooting--best-practices)
14. [License & Copyright](#14-license--copyright)

---

## 1. Executive Summary & Capabilities

**Mjolnir** is a state-of-the-art desktop server load and stress-testing application designed to exceed the combined feature sets of industry tools like **k6**, **Apache JMeter**, **Locust**, and **Vegeta**.

By separating the visual presentation layer from the traffic generation engine, Mjolnir delivers **millions of requests per second** with ultra-low latency overhead while maintaining a 60 FPS, responsive glassmorphism desktop user interface.

### Key Highlights:
- **Ultra-High Throughput:** Built on a compiled Rust core powered by the asynchronous `Tokio` runtime and `Hyper` network libraries.
- **Multi-Protocol Support:** Full out-of-the-box support for HTTP/1.1, HTTP/2 (multiplexed), HTTP/3 (QUIC/UDP), and persistent WebSockets.
- **Dual Scripting Modes:** Build workflows visually using drag-and-drop nodes or write advanced scripting logic in TypeScript/JavaScript via the embedded JS runtime.
- **Real-Time Correlation:** Track target server CPU, Memory, Disk, and Network I/O over direct SSH simultaneously while hammering the endpoints with traffic.
- **Cloud Scale:** Seamlessly switch between Standalone desktop testing, Master orchestration, and remote daemon Worker nodes.

---

## 2. System Architecture Overview

Mjolnir utilizes a three-tier hybrid monorepo architecture:

```
+-----------------------------------------------------------------------------------+
|                        MJOLNIR DESKTOP APPLICATION                                |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |             CONTROL PLANE (Electron + React.js / Next.js UI)                |  |
|  |  * Visual Script Builder    * Live Charts (uPlot)    * SSH Host Monitor     |  |
|  +-----------------------------------------------------------------------------+  |
|                                     |                                             |
|                                IPC / WebSocket                                    |
|                                     v                                             |
|  +-----------------------------------------------------------------------------+  |
|  |               NODE.JS IPC BRIDGE (Electron Main Process)                    |  |
|  |  * Process Lifecycle        * Native SSH2 Client     * File I/O & Dialogs   |  |
|  +-----------------------------------------------------------------------------+  |
|                                     |                                             |
|                        Local WebSocket / Binary Pipe                              |
|                                     v                                             |
|  +-----------------------------------------------------------------------------+  |
|  |         EXECUTION CORE ENGINE (Compiled High-Performance Rust Binary)       |  |
|  |  * Tokio Async Runtime      * Hyper HTTP/1, HTTP/2   * Quinn HTTP/3 (QUIC)  |  |
|  |  * Tungstenite WebSockets   * Embedded JS Runtime    * InfluxDB / Datadog   |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

1. **Frontend Control Plane (`/apps/desktop/src`):** Built with React 18, Vite, and Tailwind CSS. Renders real-time telemetry at 60 Hz using hardware-accelerated SVG and `uPlot` canvas charts.
2. **IPC Bridge (`/apps/desktop/electron`):** Acts as the intermediary. Manages spawning the native Rust binary, monitoring system health, establishing direct SSH host connections, and handling native OS file dialogs.
3. **Rust Native Engine (`/engine`):** An independent, native executable (`mjolnir-engine.exe`) written in Rust. It executes the actual network stress tests, manages connection pooling, calculates P50/P90/P95/P99 latency quantiles, and streams metric data packets back to the UI.

---

## 3. Installation & Getting Started

### Prerequisites
- **Operating System:** Windows 10/11, macOS (Intel/Apple Silicon), or Linux.
- **Node.js:** v18.0.0 or higher.
- **Package Manager:** `pnpm` (recommended) or `npm`.
- **Rust Toolchain:** `rustc` and `cargo` (required only if modifying or rebuilding the native engine).

### Quickstart Guide

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/TheLunatic1/Mjolnir.git
   cd Mjolnir
   ```

2. **Install Workspace Dependencies:**
   ```bash
   npx -y pnpm@latest install
   ```

3. **Build the Rust Core Engine (Windows / macOS / Linux):**
   ```bash
   npm run build:engine
   ```
   > *Note for Windows Users:* Our automated build script detects your MSVC Visual Studio Build Tools and Windows SDK automatically. If the build fails due to a missing SDK, run:  
   > `winget install Microsoft.WindowsSDK.10.0.22621`

4. **Launch the Development Workspace:**
   ```bash
   npm run dev
   ```
   This compiles shared types, starts the Vite React development server, and opens the native Electron window.

---

## 4. The Control Plane UI Navigation

When Mjolnir launches, the user interface is organized into seven primary workspaces accessible from the **Left Navigation Sidebar**:

1. **Live Dashboard:** Real-time visualization of active Virtual Users (VUs), Requests Per Second (RPS), Throughput (KB/s), error rates, and live quantile latency histograms.
2. **Visual Builder:** Drag-and-drop workflow designer for configuring multi-step HTTP requests, headers, authentication tokens, and payload bodies.
3. **Code Mode (JS/TS):** Integrated Monaco code editor for writing complex JavaScript/TypeScript stress scripts with custom branching and extraction logic.
4. **Host SSH Stats:** Real-time Linux/Unix server infrastructure monitoring over SSH (CPU, Load Average, Memory, Disk, and Interface Traffic).
5. **Cloud Cluster:** Manage distributed testing topologies. Switch between Standalone desktop mode, Master orchestration mode, and Worker daemons.
6. **Reports & Export:** Review historical test runs, analyze latency distributions, and export data to CSV, JSON, or executive summaries.
7. **Settings & SLA:** Configure global TLS verification rules, minimum protocol versions, InfluxDB v2, and Datadog DogStatsD telemetry exporters.

At the top of the screen resides the **Title Bar Strike Controller**:
- **Start / Restart Native Engine:** Initializes the background Rust execution process.
- **Cluster Topology Switcher:** Toggle between `Standalone`, `Master`, and `Worker` modes.
- **Launch Strike:** Begins generating load against the configured target.
- **Abort Strike:** Instantly terminates all active socket connections and halts the test.

---

## 5. Visual Script Builder (No-Code Testing)

The **Visual Builder** allows engineers and QA teams to design complex load-testing scenarios without writing code.

### Step-by-Step Guide to Creating a Visual Scenario:
1. Navigate to the **Visual Builder** tab in the sidebar.
2. Under **General Configuration**, enter a descriptive name for your scenario (e.g., `"E-Commerce Checkout Pipeline"`).
3. Select your desired **Target Protocol**:
   - `HTTP/1.1`: Standard web REST APIs.
   - `HTTP/2`: High-speed multiplexed APIs (recommended for microservices).
   - `HTTP/3 (QUIC)`: Next-generation UDP-based web protocols.
   - `WebSocket`: Persistent bi-directional streaming connections.
4. Add **Request Nodes**:
   - Click **`+ Add Request Step`** to append a new request node to the execution pipeline.
   - Specify the HTTP Method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`).
   - Enter the full target URL (e.g., `https://api.example.com/v1/auth/login`).
5. Configure **Headers & Payloads**:
   - Add required headers such as `Content-Type: application/json` or `Authorization: Bearer <token>`.
   - For `POST` or `PUT` requests, paste your JSON body or XML payload directly into the Body editor.
6. Set **Assertions & SLAs**:
   - Add latency assertions (e.g., `Response Time < 200ms`).
   - Add status code checks (e.g., `Status Code == 200` or `201`).

---

## 6. Code Mode (Embedded JS/TS Runtime)

For advanced scenarios requiring dynamic variables, login token extraction, or conditional logic, switch to **Code Mode (JS/TS)**. Mjolnir embeds a high-performance JavaScript engine directly inside the Rust core.

### Sample Code Mode Script:

```javascript
// Mjolnir Advanced Code Mode — Custom Script
// Created by: TheLunatic1 (Salman Toha)

export default async function(context) {
  // Step 1: Authenticate and extract JWT token
  const loginRes = await context.http.post('https://api.example.com/v1/login', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'secret_password' })
  });

  if (loginRes.status !== 200) {
    context.metrics.recordError('Login failed');
    return;
  }

  const token = JSON.parse(loginRes.body).access_token;

  // Step 2: Query secure inventory with extracted token
  const start = Date.now();
  const dataRes = await context.http.get('https://api.example.com/v1/inventory/items', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  const duration = Date.now() - start;

  // Step 3: Record custom metrics
  context.metrics.recordLatency('inventory_query_ms', duration);
  
  if (dataRes.status === 200) {
    context.metrics.recordSuccess();
  } else {
    context.metrics.recordError('Inventory query error: ' + dataRes.status);
  }
}
```

### Advantages of Code Mode:
- **Zero Overhead Execution:** Scripts are pre-parsed and executed asynchronously across worker threads without blocking network sockets.
- **Full TypeScript Support:** Enjoy syntax highlighting, auto-completion, and error checking inside the built-in Monaco editor.

---

## 7. Execution Load Profiles

Mjolnir supports five distinct load-generation algorithms, selectable under the **Execution Profile** panel:

| Profile Name | Description | Best Used For |
| :--- | :--- | :--- |
| **Constant VU** | Maintains a fixed number of Virtual Users concurrently executing requests for a set duration. | Establishing baseline throughput and standard capacity verification. |
| **Ramping VU** | Automatically ramps Virtual Users up and down across defined time stages (e.g., 0 to 1000 VUs in 2 mins, hold for 5 mins, ramp down to 0). | Simulating organic traffic growth and finding breaking points. |
| **Constant Arrival Rate** | Generates a fixed number of Requests Per Second (RPS) regardless of how long the target server takes to respond. | Testing rate-limiters, API gateways, and strict SLA throughput guarantees. |
| **Spike Testing** | Instantly floods the target with a massive burst of traffic (e.g., jumping from 10 to 5000 VUs in 5 seconds). | Evaluating system elasticity, auto-scaling triggers, and crash recovery. |
| **Soak Testing** | Runs a moderate load continuously over several hours or days. | Identifying memory leaks, database connection pool exhaustion, and degradation over time. |

---

## 8. Protocol Capabilities

Mjolnir's native engine is engineered for maximum protocol versatility:

### HTTP/1.1 & HTTP/2
- Utilizes hyper-optimized connection pooling.
- Supports HTTP/2 multiplexing, allowing dozens of concurrent requests over a single TCP connection to eliminate TLS handshake overhead.

### HTTP/3 (QUIC / UDP)
- Built on the `Quinn` asynchronous QUIC transport library.
- Tests modern edge servers and CDN infrastructures that leverage UDP-based low-latency streaming.

### Persistent WebSockets
- Powered by `tokio-tungstenite`.
- Capable of maintaining tens of thousands of simultaneous open WebSocket connections, broadcasting ping/pong frames, and streaming real-time JSON payloads.

---

## 9. Distributed Cloud Cluster Orchestration

When testing requires generating millions of concurrent VUs that exceed the network interface limits of a single workstation, use Mjolnir's **Distributed Cloud Cluster** topology.

### How to Configure a Cluster:
1. **Deploy Worker Daemons on Remote Servers (AWS, GCP, Azure, bare-metal):**
   Copy `mjolnir-engine` to your remote cloud VMs and launch it in worker mode:
   ```bash
   ./mjolnir-engine --mode worker --port 9000
   ```
2. **Switch Desktop to Master Mode:**
   In the Mjolnir Desktop Title Bar, click **`master`**.
3. **Register Cloud Workers:**
   Navigate to the **Cloud Cluster** tab and add the IP addresses of your remote workers (e.g., `ws://10.0.1.50:9000`).
4. **Launch Distributed Strike:**
   When you click **Launch Strike**, the Master Control Plane broadcasts the test scenario, code scripts, and execution profile across all connected cloud workers simultaneously.
5. **Real-Time Aggregation:**
   All worker nodes stream sub-second telemetry back to your desktop, where Mjolnir aggregates the metrics into unified live uPlot charts!

---

## 10. Host SSH Infrastructure Monitoring

A load test is incomplete without knowing *why* latency spiked. Mjolnir includes an embedded **SSH2 Client Bridge** that connects directly to your target database or application server during the test.

### What It Monitors:
- **CPU Utilization (%):** Total system CPU load and core bottleneck identification.
- **Memory & Swap Usage:** RAM consumption and out-of-memory (OOM) detection.
- **System Load Average:** 1m, 5m, and 15m load metrics.
- **Network I/O:** Real-time incoming and outgoing interface bandwidth (KB/s and MB/s).
- **Disk I/O:** Read/write throughput on storage volumes.

### Connecting to a Target Host:
1. Go to the **Host SSH Stats** tab.
2. Enter your server IP/Hostname, SSH Port (default `22`), Username, and Authentication method (Password or SSH Private Key path).
3. Click **Connect Host Monitor**. The dashboard will instantly begin plotting live server health alongside your stress test!

---

## 11. Telemetry Exporters (InfluxDB & Datadog)

For enterprise observability integrations, Mjolnir exports real-time time-series metrics to external monitoring stacks.

### InfluxDB v2 Integration:
1. Navigate to **Settings & SLA**.
2. Toggle **InfluxDB v2** to ON.
3. Enter your InfluxDB URL (e.g., `http://localhost:8086`), Organization, Bucket name, and API Authentication Token.
4. Mjolnir will stream live metrics (RPS, latencies, errors, active VUs) directly into your InfluxDB time-series database for Grafana visualization.

### Datadog DogStatsD Integration:
1. Toggle **Datadog DogStatsD** to ON in Settings.
2. Specify the local or remote Datadog Agent Host (default `127.0.0.1`) and UDP Port (default `8125`).
3. Metrics are automatically tagged with `app:mjolnir`, `profile:<active_profile>`, and `author:thelunatic1`.

---

## 12. Reports, Analytics & Data Export

After concluding a strike, Mjolnir compiles a comprehensive executive test report in the **Reports & Export** tab.

### Available Analytics:
- **Latency Percentile Distribution:** Exact P50 (median), P90, P95, and P99 response times in milliseconds.
- **Throughput Efficiency:** Total requests transmitted versus total successful HTTP 2xx/3xx responses.
- **Error Breakdown:** Categorization of connection timeouts, DNS failures, HTTP 4xx client errors, and HTTP 5xx server faults.

### Export Formats:
- **CSV Export:** Raw time-series metric logs suitable for spreadsheet import or Jupyter Notebook analysis.
- **JSON Snapshot:** Complete structured test definition and aggregated results for automated CI/CD pipeline auditing.
- **PDF Executive Summary:** Clean, printable visual reports for management and client presentations.

---

## 13. Troubleshooting & Best Practices

### Issue: `ERROR: The process "2536" not found` when running `npm run dev`
- **Explanation:** This is a benign notification from PowerShell when the development script checks if port `5173` is occupied by a stale development server. If no process is found or the old PID already closed, PowerShell reports the PID was not found. Our latest script update handles this silently.

### Issue: Linker error `LNK1181: cannot open input file 'kernel32.lib'` during `npm run build:engine`
- **Solution:** You are missing the Windows C++ SDK headers. Open terminal as Administrator and run:
  ```powershell
  winget install Microsoft.WindowsSDK.10.0.22621 --accept-source-agreements
  ```
  Alternatively, open Visual Studio Installer -> Modify -> Check `"Desktop development with C++"` and `"Windows 10/11 SDK"`.

### Issue: SSL/TLS Handshake Failures against staging or self-signed servers
- **Solution:** Navigate to **Settings & SLA** -> check **Insecure Skip Verify**. This instructs the compiled Rust core to bypass SSL certificate validation during testing.

### Best Practice: Tuning Windows/Linux File Descriptors for Extreme Load
When generating over 10,000 concurrent VUs from a single machine, your operating system may run out of ephemeral ports or open file handles:
- **On Linux/macOS:** Increase open file limits before launching Mjolnir:
  ```bash
  ulimit -n 65535
  ```
- **On Windows:** Increase MaxUserPort in Windows Registry under `HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters`.

---

## 14. License & Copyright

Mjolnir is open-source software built with passion and precision.

```
Apache License, Version 2.0
Copyright 2026 TheLunatic1 (Salman Toha)
```

### Attribution Requirement (NOTICE)
As per Section 4(d) of the Apache License 2.0, any derivative works, redistributions, or forks of this software **MUST** include a prominent attribution to **"TheLunatic1 (Salman Toha)"**. Furthermore, if the software includes a user interface, this attribution must remain visibly displayed within the application's graphical user interface in a non-obtrusive manner. This attribution MUST include a hyperlink or direct reference to the original author's GitHub profile: [https://github.com/TheLunatic1](https://github.com/TheLunatic1).

**Designed, Engineered, and Developed by [TheLunatic1 (Salman Toha)](https://github.com/TheLunatic1).**
