<div align="center">
  <img src="logo.png" alt="Mjolnir Logo" width="120" height="120" />
  <h1>⚡ MJOLNIR</h1>
  <p><strong>The Ultimate Enterprise Load & Stress Testing Desktop Application</strong></p>
  
  <p>
    <a href="https://github.com/TheLunatic1/Mjolnir/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-00e5ff?style=for-the-badge&logo=open-source-initiative&logoColor=black" alt="License Apache 2.0" /></a>
    <img src="https://img.shields.io/badge/Core-Rust_Tokio-ff6600?style=for-the-badge&logo=rust&logoColor=white" alt="Rust Core" />
    <img src="https://img.shields.io/badge/Control_Plane-Electron_%2B_React_18-00d8ff?style=for-the-badge&logo=electron&logoColor=black" alt="Electron React" />
    <img src="https://img.shields.io/badge/Author-TheLunatic1_(Salman_Toha)-a855f7?style=for-the-badge" alt="Author TheLunatic1" />
  </p>
</div>

---

## 🔥 Overview

**Mjolnir** is a next-generation desktop server load and stress-testing application engineered to exceed the combined feature sets of **k6**, **Apache JMeter**, **Locust**, and **Vegeta**.

By uniting a **60 FPS React/Next.js Glassmorphism UI Control Plane** with a compiled **Rust asynchronous execution core**, Mjolnir generates **millions of requests per second** across distributed cloud clusters without freezing or slowing down your desktop interface.

---

## 🌟 Key Features

- **🚀 Extreme Rust Native Core:** Powered by `Tokio`, `Hyper`, and `Quinn`. Executes HTTP/1.1, HTTP/2 multiplexing, HTTP/3 (QUIC/UDP), and persistent WebSockets with zero Garbage Collection pauses.
- **🎨 Visual Script Builder:** Design complex, multi-step API stress workflows, configure custom headers, query parameters, auth tokens, and response assertions via drag-and-drop nodes—**no coding required**.
- **💻 Advanced Code Mode (JS/TS):** Write dynamic load scripts with an embedded JavaScript runtime. Extract JWT tokens from login responses, execute conditional branching, and customize load variables on the fly.
- **📈 5 Enterprise Load Profiles:**
  - **Constant VU:** Fixed concurrency for baseline testing.
  - **Ramping VU:** Stepwise ramp up/down to simulate organic traffic surges.
  - **Constant Arrival Rate:** Target exact RPS guarantees for API rate-limiter stress testing.
  - **Spike Testing:** Instant traffic bursts to test cloud auto-scaling triggers.
  - **Soak Testing:** Multi-hour/day endurance testing to identify memory leaks and DB exhaustion.
- **🖥️ Remote SSH Host Monitoring:** Connect directly to your target database or backend server over SSH. Correlate server CPU, Memory, Disk, and Network I/O metrics in real time alongside your stress histograms.
- **🌐 Distributed Cloud Cluster:** Switch between Standalone desktop testing, Master orchestration, and remote Worker daemon nodes to generate multi-region cloud traffic.
- **📡 Observability Exporters:** Stream sub-second latency percentiles (P50, P90, P95, P99) directly into **InfluxDB v2** and **Datadog DogStatsD**.

---

## 🏗️ System Architecture

```
[ Control Plane UI ]  <--- (WebSocket / IPC) --->  [ Node.js IPC Bridge ]  <--- (Binary Pipe) --->  [ Rust Core Engine ]
 (React 18 / Vite)                                  (Electron Main)                                  (Tokio / Hyper)
```

1. **Frontend UI (`/apps/desktop`):** Responsive glassmorphism interface rendering live `uPlot` canvas charts at 60 FPS.
2. **IPC Bridge (`/apps/desktop/electron`):** Spawns and manages the native Rust execution binary and direct SSH2 host monitors.
3. **Execution Engine (`/engine`):** Compiled high-performance Rust binary (`mjolnir-engine.exe`) handling asynchronous network sockets and statistical quantile aggregations.

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js:** v18.0.0+
- **pnpm:** v8.0.0+ (recommended)
- **Rust & Cargo:** Required to compile the native engine.
- **Windows C++ SDK:** Required on Windows (`winget install Microsoft.WindowsSDK.10.0.22621`).

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/TheLunatic1/Mjolnir.git
cd Mjolnir
npx -y pnpm@latest install
```

### 2. Build the Native Rust Engine
```bash
npm run build:engine
```
*This compiles `mjolnir-engine` in optimized `--release` mode and places the binary into the desktop application resources.*

### 3. Launch the Development Server
```bash
npm run dev
```
*Your desktop window will open, connect to the background Rust daemon, and display `ONLINE` in the status bar!*

---

## 📖 Complete Operational Handbook

For exhaustive instructions on designing visual pipelines, writing TypeScript load scripts, configuring cloud clusters, setting up InfluxDB exporters, and interpreting P99 latency charts, refer to our comprehensive user handbook:

👉 **[Read the Mjolnir Operational Handbook (HANDBOOK.md)](./HANDBOOK.md)** 👈

---

## 📄 License & Attribution

```
Apache License, Version 2.0
Copyright 2026 TheLunatic1 (Salman Toha)
```

This software is released under the **Apache License 2.0**. You are free to use, modify, and distribute this software in compliance with the license terms.

### ⚠️ Attribution Requirement (NOTICE)
As per Section 4(d) of the Apache License 2.0, any derivative works, redistributions, or forks of this software **MUST** include a prominent attribution to **"TheLunatic1 (Salman Toha)"**. Furthermore, if the software includes a user interface, this attribution must remain visibly displayed within the application's graphical user interface in a non-obtrusive manner. This attribution MUST include a hyperlink or direct reference to the original author's GitHub profile: [https://github.com/TheLunatic1](https://github.com/TheLunatic1).

---

<div align="center">
  <p><strong>Designed, Engineered, and Developed with ❤️ by <a href="https://github.com/TheLunatic1">TheLunatic1 (Salman Toha)</a></strong></p>
  <p><em>Mjolnir — Strike with the force of thunder.</em></p>
</div>
