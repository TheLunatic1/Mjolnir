import fs from 'fs';
import Papa from 'papaparse';

export class CsvParserBridge {
  public static async parseCsvFile(filePath: string, maxRows: number = 1000): Promise<{ headers: string[]; previewRows: any[]; totalRows: number; error?: string }> {
    return new Promise((resolve) => {
      if (!fs.existsSync(filePath)) {
        return resolve({ headers: [], previewRows: [], totalRows: 0, error: 'File not found' });
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      let totalRows = 0;
      let headers: string[] = [];
      let previewRows: any[] = [];

      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        step: (results, parser) => {
          if (totalRows === 0 && results.meta.fields) {
            headers = results.meta.fields;
          }
          if (totalRows < maxRows) {
            previewRows.push(results.data);
          }
          totalRows++;
          if (totalRows >= 500000) {
            // Cap count check at 500k for preview speed
            parser.abort();
          }
        },
        complete: () => {
          resolve({ headers, previewRows, totalRows });
        },
        error: (err: any) => {
          resolve({ headers: [], previewRows: [], totalRows: 0, error: err.message });
        }
      });
    });
  }
}
