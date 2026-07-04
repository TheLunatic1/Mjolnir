## Mjolnir v0.1.0 — Enterprise Load & Stress Testing Platform

Mjolnir is an ultra-high performance desktop load testing application powered by a compiled Rust core and a 60 FPS glassmorphism UI.

> [!NOTE]
> **Windows SmartScreen Notice:**
> Because Mjolnir is an open-source application built without a paid corporate code-signing certificate, Microsoft Defender SmartScreen may display a *"Windows protected your PC"* popup when launching the installer.
> 
> To proceed safely, simply click **More info** → **Run anyway**. Mjolnir is 100% clean, transparent, and open-source!

---

### Highlights of this Release:
- **Compiled Rust Core Engine:** Capable of generating millions of requests per second with minimal CPU and RAM overhead using asynchronous Tokio workers and Hyper.
- **Multi-Protocol Capabilities:** Full out-of-the-box support for HTTP/1.1, HTTP/2 (multiplexed), HTTP/3 (QUIC/UDP), and persistent WebSockets.
- **Visual Builder & Code Mode:** Design tests using drag-and-drop workflow pipelines or write advanced JavaScript/TypeScript scripting logic in the embedded Monaco editor.
- **Real-Time SSH Monitoring:** Correlate target server health (CPU, RAM, Disk, Network I/O) over SSH while executing high-concurrency strikes.
- **Smart Stream Cutoff:** Automated dashboard telemetry reset that prevents trailing frames from contaminating new test graphs.
- **Executive Audit Reports:** Export comprehensive test summaries and latency quantile histograms to CSV, JSON, or formatted PDF documents.

---

_Made by [TheLunatic1 (Salman Toha)](https://github.com/TheLunatic1)_
