import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export class ReportGeneratorBridge {
  public static async generateHtmlReport(summary: any, targetPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const totalReq = summary.totalRequests || 0;
      const succReq = summary.successfulRequests || 0;
      const failReq = summary.failedRequests || 0;
      const peakRps = Math.round(summary.peakRps || 0);
      const errorRate = ((failReq / Math.max(1, totalReq)) * 100).toFixed(2);
      const p50 = summary.latencies?.total_duration?.p50 || summary.latencies?.totalDuration?.p50 || 0;
      const p90 = summary.latencies?.total_duration?.p90 || summary.latencies?.totalDuration?.p90 || 0;
      const p95 = summary.latencies?.total_duration?.p95 || summary.latencies?.totalDuration?.p95 || 0;
      const p99 = summary.latencies?.total_duration?.p99 || summary.latencies?.totalDuration?.p99 || 0;
      const max = summary.latencies?.total_duration?.max || summary.latencies?.totalDuration?.max || 0;
      const maxVal = Math.max(1, p50, p90, p95, p99, max);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mjolnir Telemetry Dashboard - ${summary.scenarioName || 'Strike Run'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; background: #070a12; color: #f8fafc; padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; space-y: 24px; }
    .header { background: linear-gradient(135deg, #101726 0%, #0c101c 100%); border: 1px solid #1e293b; padding: 24px 32px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 24px; }
    .header h1 { font-size: 26px; font-weight: 800; background: linear-gradient(to right, #00f2fe, #4facfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header .meta { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .badge { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 6px 14px; border-radius: 99px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
    .badge.err { background: rgba(244, 63, 94, 0.15); border-color: rgba(244, 63, 94, 0.3); color: #fb7185; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .card { background: #0d1322; border: 1px solid #1e293b; padding: 22px; border-radius: 14px; position: relative; overflow: hidden; }
    .card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, #00f2fe, transparent); }
    .card.green::before { background: linear-gradient(90deg, #10b981, transparent); }
    .card.amber::before { background: linear-gradient(90deg, #f59e0b, transparent); }
    .card.rose::before { background: linear-gradient(90deg, #f43f5e, transparent); }
    .card .label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card .value { font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; color: #f8fafc; }
    .section { background: #0d1322; border: 1px solid #1e293b; padding: 28px; border-radius: 16px; margin-bottom: 24px; }
    .section h2 { font-size: 18px; font-weight: 700; color: #38bdf8; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .bar-row { display: flex; align-items: center; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
    .bar-label { width: 180px; color: #cbd5e1; }
    .bar-val { width: 100px; color: #f8fafc; font-weight: 700; }
    .bar-track { flex: 1; background: #1e293b; height: 12px; border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #00f2fe, #3b82f6); transition: width 0.5s ease; }
    .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; }
    .footer strong { color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>MJOLNIR ENTERPRISE TELEMETRY DASHBOARD</h1>
        <div class="meta">Scenario: <strong>${summary.scenarioName || 'Stress Target'}</strong> | Date: ${summary.timestamp || new Date().toLocaleString()}</div>
      </div>
      <div class="badge ${failReq > 0 ? 'err' : ''}">${failReq === 0 ? '100% SUCCESS' : `${errorRate}% ERROR`}</div>
    </div>

    <div class="kpi-grid">
      <div class="card">
        <div class="label">Total Requests</div>
        <div class="value">${totalReq.toLocaleString()}</div>
      </div>
      <div class="card green">
        <div class="label">Peak Throughput</div>
        <div class="value" style="color:#34d399">${peakRps.toLocaleString()} <span style="font-size:14px">RPS</span></div>
      </div>
      <div class="card amber">
        <div class="label">P95 Latency</div>
        <div class="value" style="color:#fbbf24">${p95.toFixed(1)} <span style="font-size:14px">ms</span></div>
      </div>
      <div class="card rose">
        <div class="label">Error Rate</div>
        <div class="value" style="color:${failReq > 0 ? '#fb7185' : '#34d399'}">${errorRate}%</div>
      </div>
    </div>

    <div class="section">
      <h2>Latency Percentile Distribution Histogram</h2>
      <div class="bar-row">
        <div class="bar-label">P50 (Median)</div>
        <div class="bar-val">${p50.toFixed(1)} ms</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (p50 / maxVal) * 100)}%; background:#38bdf8"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">P90 Percentile</div>
        <div class="bar-val">${p90.toFixed(1)} ms</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (p90 / maxVal) * 100)}%; background:#818cf8"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">P95 Percentile</div>
        <div class="bar-val">${p95.toFixed(1)} ms</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (p95 / maxVal) * 100)}%; background:#fbbf24"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">P99 Percentile</div>
        <div class="bar-val">${p99.toFixed(1)} ms</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (p99 / maxVal) * 100)}%; background:#fb7185"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">Max Latency</div>
        <div class="bar-val">${max.toFixed(1)} ms</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (max / maxVal) * 100)}%; background:#c084fc"></div></div>
      </div>
    </div>

    <div class="footer">
      Generated by <strong>Mjolnir Enterprise Stress Testing Suite</strong> &bull; Made by <strong>TheLunatic1 (Salman Toha)</strong>
    </div>
  </div>
</body>
</html>`;
      fs.writeFileSync(targetPath, html, 'utf-8');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public static async generatePdfReport(summary: any, targetPath: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const stream = fs.createWriteStream(targetPath);
        doc.pipe(stream);

        const totalReq = summary.totalRequests || 0;
        const succReq = summary.successfulRequests || 0;
        const failReq = summary.failedRequests || 0;
        const peakRps = Math.round(summary.peakRps || 0);
        const errorRate = ((failReq / Math.max(1, totalReq)) * 100).toFixed(2);
        const p50 = summary.latencies?.total_duration?.p50 || summary.latencies?.totalDuration?.p50 || 0;
        const p90 = summary.latencies?.total_duration?.p90 || summary.latencies?.totalDuration?.p90 || 0;
        const p95 = summary.latencies?.total_duration?.p95 || summary.latencies?.totalDuration?.p95 || 0;
        const p99 = summary.latencies?.total_duration?.p99 || summary.latencies?.totalDuration?.p99 || 0;
        const max = summary.latencies?.total_duration?.max || summary.latencies?.totalDuration?.max || 0;
        const maxVal = Math.max(1, p50, p90, p95, p99, max);

        // 1. Dark Cyberpunk Background
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#070a12');

        // 2. Header Banner
        doc.rect(20, 20, doc.page.width - 40, 75).fillAndStroke('#101726', '#1e293b');
        doc.rect(20, 93, doc.page.width - 40, 2).fill('#00f2fe');

        doc.fillColor('#00f2fe').fontSize(18).font('Helvetica-Bold').text('MJOLNIR TELEMETRY DASHBOARD', 40, 35);
        doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text(`Scenario: ${summary.scenarioName || 'Stress Strike'} | Completed: ${summary.timestamp || new Date().toLocaleString()}`, 40, 60);

        // Badge inside header
        const badgeText = failReq === 0 ? '100% SUCCESS' : `${errorRate}% ERROR`;
        const badgeColor = failReq === 0 ? '#10b981' : '#f43f5e';
        doc.roundedRect(doc.page.width - 150, 40, 110, 28, 14).fillAndStroke('#0d1322', badgeColor);
        doc.fillColor(badgeColor).fontSize(10).font('Helvetica-Bold').text(badgeText, doc.page.width - 150, 49, { width: 110, align: 'center' });

        // 3. KPI Cards Grid (4 boxes)
        const cardW = 125;
        const cardH = 65;
        const startX = 20;
        const startY = 115;
        const gap = 15;

        const kpis = [
          { label: 'TOTAL REQUESTS', val: totalReq.toLocaleString(), color: '#f8fafc', accent: '#00f2fe' },
          { label: 'PEAK THROUGHPUT', val: `${peakRps.toLocaleString()} rps`, color: '#34d399', accent: '#10b981' },
          { label: 'P95 LATENCY', val: `${p95.toFixed(1)} ms`, color: '#fbbf24', accent: '#f59e0b' },
          { label: 'ERROR RATE', val: `${errorRate}%`, color: failReq > 0 ? '#fb7185' : '#34d399', accent: failReq > 0 ? '#f43f5e' : '#10b981' },
        ];

        kpis.forEach((kpi, i) => {
          const x = startX + i * (cardW + gap);
          doc.roundedRect(x, startY, cardW, cardH, 8).fillAndStroke('#0d1322', '#1e293b');
          doc.rect(x, startY, cardW, 3).fill(kpi.accent);
          doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(kpi.label, x + 12, startY + 14);
          doc.fillColor(kpi.color).fontSize(14).font('Helvetica-Bold').text(kpi.val, x + 12, startY + 34);
        });

        // 4. Latency Distribution Histogram Section
        const latY = 200;
        doc.roundedRect(20, latY, doc.page.width - 40, 185, 10).fillAndStroke('#0d1322', '#1e293b');
        doc.fillColor('#38bdf8').fontSize(12).font('Helvetica-Bold').text('LATENCY PERCENTILE DISTRIBUTION HISTOGRAM (MS)', 40, latY + 20);

        const latRows = [
          { label: 'P50 (Median)', val: p50, color: '#38bdf8' },
          { label: 'P90 Percentile', val: p90, color: '#818cf8' },
          { label: 'P95 Percentile', val: p95, color: '#fbbf24' },
          { label: 'P99 Percentile', val: p99, color: '#fb7185' },
          { label: 'Max Observed', val: max, color: '#c084fc' },
        ];

        latRows.forEach((row, idx) => {
          const rowY = latY + 50 + idx * 25;
          doc.fillColor('#cbd5e1').fontSize(10).font('Helvetica').text(row.label, 40, rowY);
          doc.fillColor(row.color).font('Helvetica-Bold').text(`${row.val.toFixed(1)} ms`, 160, rowY);

          // Bar track
          const barX = 240;
          const maxBarW = doc.page.width - 300;
          const barW = Math.max(4, (row.val / maxVal) * maxBarW);
          doc.roundedRect(barX, rowY + 1, maxBarW, 10, 5).fill('#1e293b');
          doc.roundedRect(barX, rowY + 1, barW, 10, 5).fill(row.color);
        });

        // 5. Verification & Attribution Box
        const vY = 405;
        doc.roundedRect(20, vY, doc.page.width - 40, 70, 10).fillAndStroke('#101726', '#1e293b');
        doc.fillColor('#00f2fe').fontSize(11).font('Helvetica-Bold').text('EXECUTION TELEMETRY & AUDIT VERIFICATION', 40, vY + 16);
        doc.fillColor('#cbd5e1').fontSize(9).font('Helvetica').text(`Total Processed: ${totalReq.toLocaleString()} | Successful: ${succReq.toLocaleString()} | Failed: ${failReq.toLocaleString()} | Peak: ${peakRps.toLocaleString()} rps`, 40, vY + 38);

        // Footer
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Generated by Mjolnir — Ultimate Enterprise Stress Testing Suite | Made by TheLunatic1 (Salman Toha)', 0, doc.page.height - 35, { align: 'center' });

        doc.end();
        stream.on('finish', () => resolve({ success: true }));
        stream.on('error', (err) => resolve({ success: false, error: err.message }));
      } catch (e: any) {
        resolve({ success: false, error: e.message });
      }
    });
  }
}
