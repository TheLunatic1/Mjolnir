use super::{aggregator::MetricsAggregator, LiveMetricsFrame, RequestSample};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};

pub struct MetricsCollector {
    sender: UnboundedSender<RequestSample>,
    aggregator: Arc<Mutex<MetricsAggregator>>,
}

impl MetricsCollector {
    pub fn new() -> Self {
        let (sender, receiver) = unbounded_channel();
        let aggregator = Arc::new(Mutex::new(MetricsAggregator::new()));

        let agg_clone = aggregator.clone();
        tokio::spawn(async move {
            Self::process_loop(receiver, agg_clone).await;
        });

        Self { sender, aggregator }
    }

    pub fn get_sender(&self) -> UnboundedSender<RequestSample> {
        self.sender.clone()
    }

    async fn process_loop(
        mut receiver: UnboundedReceiver<RequestSample>,
        aggregator: Arc<Mutex<MetricsAggregator>>,
    ) {
        while let Some(sample) = receiver.recv().await {
            let mut batch = Vec::with_capacity(10000);
            batch.push(sample);

            // Drain up to 10000 samples per lock acquisition to prevent starvation under heavy load
            while let Ok(s) = receiver.try_recv() {
                batch.push(s);
                if batch.len() >= 10000 {
                    break;
                }
            }

            let mut agg = aggregator.lock().unwrap();
            for s in batch {
                agg.record(s);
            }
        }
    }

    pub async fn get_live_frame(&self, elapsed_sec: f64, current_vus: u32) -> LiveMetricsFrame {
        let agg = self.aggregator.lock().unwrap();
        agg.generate_frame(elapsed_sec, current_vus)
    }

    pub async fn reset(&self) {
        let mut agg = self.aggregator.lock().unwrap();
        *agg = MetricsAggregator::new();
    }
}
