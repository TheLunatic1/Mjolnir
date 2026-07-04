import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export class ReportGeneratorBridge {
  public static async generateHtmlReport(summary: any, targetPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mjolnir Load Test Report - ${summary.scenarioName || 'Test'}</title>
  <style>
    body { font-family: 'Inter', sans-serif; background: #090d16; color: #f1f5f9; padding: 40px; }
    .header { border-bottom: 2px solid #00f2fe; padding-bottom: 20px; margin-bottom: 30px; }
    h1 { color: #00f2fe; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .card { background: #101726; padding: 20px; border-radius: 8px; border: 1px solid #1e293b; }
    .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #94a3b8; }
    .card .val { font-size: 28px; font-weight: bold; color: #00f2fe; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #1e293b; }
    th { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Mjolnir Enterprise Test Report</h1>
    <p>Scenario: <strong>${summary.scenarioName || 'Unnamed Scenario'}</strong> | Completed: ${new Date().toLocaleString()}</p>
  </div>
  <div class="grid">
    <div class="card"><h3>TOTAL REQUESTS</h3><div class="val">${summary.totalRequests || 0}</div></div>
    <div class="card"><h3>PEAK RPS</h3><div class="val">${Math.round(summary.peakRps || 0)}</div></div>
    <div class="card"><h3>P95 LATENCY</h3><div class="val">${(summary.latencies?.total_duration?.p95 || 0).toFixed(2)} ms</div></div>
    <div class="card"><h3>ERROR RATE</h3><div class="val" style="color:${summary.failedRequests > 0 ? '#f43f5e' : '#10b981'}">${((summary.failedRequests / Math.max(1, summary.totalRequests)) * 100).toFixed(2)}%</div></div>
  </div>
  <h2>Latency Percentile Breakdown (ms)</h2>
  <table>
    <tr><th>Metric</th><th>P50</th><th>P90</th><th>P95</th><th>P99</th><th>P99.9</th><th>Max</th></tr>
    <tr>
      <td>Total Duration</td>
      <td>${(summary.latencies?.total_duration?.p50 || 0).toFixed(2)}</td>
      <td>${(summary.latencies?.total_duration?.p90 || 0).toFixed(2)}</td>
      <td>${(summary.latencies?.total_duration?.p95 || 0).toFixed(2)}</td>
      <td>${(summary.latencies?.total_duration?.p99 || 0).toFixed(2)}</td>
      <td>${(summary.latencies?.total_duration?.p999 || 0).toFixed(2)}</td>
      <td>${(summary.latencies?.total_duration?.max || 0).toFixed(2)}</td>
    </tr>
  </table>
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
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(targetPath);
        doc.pipe(stream);

        doc.fillColor('#00f2fe').fontSize(24).text('⚡ Mjolnir Enterprise Test Summary', { align: 'center' });
        doc.moveDown(0.5);
        doc.fillColor('#333333').fontSize(12).text(`Scenario: ${summary.scenarioName || 'Unnamed Scenario'} | Date: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        doc.fillColor('#000000').fontSize(16).text('Key Performance Indicators');
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Total Requests: ${summary.totalRequests || 0}`);
        doc.text(`Successful Requests: ${summary.successfulRequests || 0}`);
        doc.text(`Failed Requests: ${summary.failedRequests || 0}`);
        doc.text(`Peak Requests Per Second (RPS): ${Math.round(summary.peakRps || 0)}`);
        doc.moveDown(1.5);

        doc.fontSize(16).text('Latency Breakdown (ms)');
        doc.moveDown(0.5);
        doc.fontSize(12).text(`P50 (Median): ${(summary.latencies?.total_duration?.p50 || 0).toFixed(2)} ms`);
        doc.text(`P90 Latency: ${(summary.latencies?.total_duration?.p90 || 0).toFixed(2)} ms`);
        doc.text(`P95 Latency: ${(summary.latencies?.total_duration?.p95 || 0).toFixed(2)} ms`);
        doc.text(`P99 Latency: ${(summary.latencies?.total_duration?.p99 || 0).toFixed(2)} ms`);
        doc.text(`Max Latency: ${(summary.latencies?.total_duration?.max || 0).toFixed(2)} ms`);

        doc.end();
        stream.on('finish', () => resolve({ success: true }));
        stream.on('error', (err) => resolve({ success: false, error: err.message }));
      } catch (e: any) {
        resolve({ success: false, error: e.message });
      }
    });
  }
}
