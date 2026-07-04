use super::{aggregator::MetricsAggregator, LiveMetricsFrame, RequestSample};
use std::sync::Arc;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio::sync::RwLock;

pub struct MetricsCollector {
    sender: UnboundedSender<RequestSample>,
    aggregator: Arc<RwLock<MetricsAggregator>>,
}

impl MetricsCollector {
    pub fn new() -> Self {
        let (sender, receiver) = unbounded_channel();
        let aggregator = Arc::new(RwLock::new(MetricsAggregator::new()));

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
        aggregator: Arc<RwLock<MetricsAggregator>>,
    ) {
        while let Some(sample) = receiver.recv().await {
            let mut agg = aggregator.write().await;
            agg.record(sample);
        }
    }

    pub async fn get_live_frame(&self, elapsed_sec: f64, current_vus: u32) -> LiveMetricsFrame {
        let agg = self.aggregator.read().await;
        agg.generate_frame(elapsed_sec, current_vus)
    }

    pub async fn reset(&self) {
        let mut agg = self.aggregator.write().await;
        *agg = MetricsAggregator::new();
    }
}
