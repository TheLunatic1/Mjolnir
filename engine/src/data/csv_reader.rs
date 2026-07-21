use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::sync::atomic::{AtomicUsize, Ordering};

pub struct CsvParameterReader {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
    counter: AtomicUsize,
    pub loop_data: bool,
}

impl CsvParameterReader {
    pub fn from_file(path: &str, delimiter: u8, loop_data: bool) -> Result<Self, Box<dyn std::error::Error>> {
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        let mut lines = reader.lines();

        let header_line = lines.next().ok_or("CSV is empty")??;
        let headers: Vec<String> = header_line
            .split(delimiter as char)
            .map(|s| s.trim().to_string())
            .collect();

        let mut rows = Vec::new();
        for line in lines {
            if let Ok(l) = line {
                if !l.trim().is_empty() {
                    let cols: Vec<String> = l.split(delimiter as char).map(|s| s.trim().to_string()).collect();
                    rows.push(cols);
                }
            }
        }

        Ok(Self {
            headers,
            rows,
            counter: AtomicUsize::new(0),
            loop_data,
        })
    }

    pub fn next_row(&self) -> Option<HashMap<String, String>> {
        if self.rows.is_empty() {
            return None;
        }

        let idx = self.counter.fetch_add(1, Ordering::SeqCst);
        let row_idx = if self.loop_data {
            idx % self.rows.len()
        } else if idx < self.rows.len() {
            idx
        } else {
            return None;
        };

        let row = &self.rows[row_idx];
        let mut map = HashMap::new();
        for (i, header) in self.headers.iter().enumerate() {
            let val = row.get(i).cloned().unwrap_or_default();
            map.insert(header.clone(), val);
        }

        Some(map)
    }
}
