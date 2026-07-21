# Mjolnir Release Notes — Enterprise Load & Stress Testing Platform

> [!NOTE]
> **Windows SmartScreen Notice:**
> Because Mjolnir is an open-source application built without a paid corporate code-signing certificate, Microsoft Defender SmartScreen may display a *"Windows protected your PC"* popup when launching the installer.
> 
> To proceed safely, simply click **More info** → **Run anyway**. Mjolnir is 100% clean, transparent, and open-source!

---

## Mjolnir v0.2.0 — Hardware Diagnostics, Dynamic Ramping & Enterprise Telemetry

### Highlights of v0.2.0:
- **PC Benchmark & Bottleneck Analysis Suite:**
  - **Hardware & Network Diagnostics:** Measures local CPU operations/sec, total RAM capacity, active network interfaces, and round-trip target latency.
  - **Intelligent Bottleneck Detection:** Automatically diagnoses whether single-instance throughput is limited by target latency (`>200ms`), bandwidth saturation, memory ceiling (`~150KB per async VU`), or CPU bottlenecks.
  - **Actionable Remediation Guidance:** Provides specific recommendations for each detected constraint (e.g., deploying regional worker nodes, increasing RAM, or utilizing distributed cluster mode).
  - **Interactive VU Projection Calculator:** Powered by **Little's Law** (`RPS = VUs ÷ Latency`). Use the interactive slider (up to 100,000 VUs) to instantly project estimated Target RPS, round-trip latency, RAM allocation, and network bandwidth with real-time feasibility verification.

- **Dynamic Ramping VUs & Execution Telemetry:**
  - **Real-Time Stage Synchronization:** During multi-stage Ramping VUs (`Stage 1: 500 VUs` → `Stage 2: 1,000 VUs` → etc.), live dashboard and status bar metrics dynamically report exact active concurrency at every half-second tick (`RampingVuExecutor`).
  - **Multi-Profile Execution Engine:** Seamless switching across Constant VUs, Ramping Stages, Constant Arrival Rate (`RPS`), Spike Strikes, and long-duration Soak tests.

- **Telemetry Lifecycle & Status Bar Polish:**
  - **Auto-Zeroing Metrics:** When a strike finishes or is aborted, the Live Dashboard and Status Bar ticker instantly zero out active rates (`0 VUs | 0 RPS | 0.0 KB/s`) while preserving total request counts, peak RPS, and latency histograms inside the permanent audit report.
  - **Pristine Console Output:** Stripped raw ANSI terminal escape codes (`E[2m`, `\x1b[2m`) from the Rust core tracing stream, ensuring clean timestamps in the Log Drawer and Status Bar ticker.

- **Rust Core Stability & Zero-Warning Compilation:**
  - **Telemetry Deadlock Elimination:** Optimized the engine's `MetricsCollector` by migrating from async `RwLock` to a highly-efficient `std::sync::Mutex` paired with 10,000-sample batch draining. This eliminates writer-starvation and prevents dashboard freezes during high-throughput loads.
  - **CPU Starvation Protection:** Added an intelligent `yield` safety valve inside the core Virtual User loop. If a target server instantly rejects connections (e.g. `Connection Refused`), the engine instantly yields CPU control, protecting the Tokio thread pool from lockups and guaranteeing continuous metrics reporting even under 100% failure rates.

- **UI & Interface Cleanup:**
  - Removed the legacy SSH Host Stats configurations, replacing them completely with a cleaner, specialized interface focus.

_Made by [TheLunatic1 (Salman Toha)](https://github.com/TheLunatic1)_
