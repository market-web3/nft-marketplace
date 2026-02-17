use hyper::{Body, Request, Response, Server};
use hyper::service::{make_service_fn, service_fn};
use prometheus::{Counter, Gauge, Histogram, IntCounter, IntGauge, Encoder, TextEncoder};
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use tracing::{error, info};

// Metrics
lazy_static::lazy_static! {
    static ref BLOCKS_PROCESSED: IntCounter = IntCounter::new(
        "indexer_blocks_processed_total",
        "Total number of blocks processed"
    ).unwrap();

    static ref CURRENT_BLOCK: IntGauge = IntGauge::new(
        "indexer_current_block",
        "Current block number being processed"
    ).unwrap();

    static ref EVENTS_PROCESSED: Counter = Counter::new(
        "indexer_events_processed_total",
        "Total number of events processed"
    ).unwrap();

    static ref EVENTS_PROCESSED_BY_TYPE: Counter = Counter::new(
        "indexer_events_processed_by_type",
        "Number of events processed by type"
    ).unwrap();

    static ref PROCESSING_TIME: Histogram = Histogram::with_opts(
        prometheus::HistogramOpts::new(
            "indexer_processing_duration_seconds",
            "Time taken to process blocks"
        )
        .buckets(vec![0.1, 0.5, 1.0, 5.0, 10.0, 30.0])
    ).unwrap();

    static ref PARSE_TIME: Histogram = Histogram::with_opts(
        prometheus::HistogramOpts::new(
            "indexer_parse_duration_seconds",
            "Time taken to parse blocks"
        )
        .buckets(vec![0.01, 0.05, 0.1, 0.5, 1.0, 5.0])
    ).unwrap();

    static ref KAFKA_MESSAGES_SENT: IntCounter = IntCounter::new(
        "indexer_kafka_messages_sent_total",
        "Total number of messages sent to Kafka"
    ).unwrap();

    static ref SCYLLA_WRITES: IntCounter = IntCounter::new(
        "indexer_scylla_writes_total",
        "Total number of writes to ScyllaDB"
    ).unwrap();

    static ref ERRORS: IntCounter = IntCounter::new(
        "indexer_errors_total",
        "Total number of errors"
    ).unwrap();

    static ref CONNECTION_ERRORS: IntCounter = IntCounter::new(
        "indexer_connection_errors_total",
        "Total number of connection errors"
    ).unwrap();
}

pub fn increment_blocks_processed() {
    BLOCKS_PROCESSED.inc();
}

pub fn set_current_block(block: u32) {
    CURRENT_BLOCK.set(block as i64);
}

pub fn increment_events_processed(event_type: &str) {
    EVENTS_PROCESSED.inc();
    EVENTS_PROCESSED_BY_TYPE.with_label_values(&[event_type]).inc();
}

pub fn observe_processing_time(duration: f64) {
    PROCESSING_TIME.observe(duration);
}

pub fn observe_parse_time(duration: f64) {
    PARSE_TIME.observe(duration);
}

pub fn increment_kafka_messages_sent() {
    KAFKA_MESSAGES_SENT.inc();
}

pub fn increment_scylla_writes() {
    SCYLLA_WRITES.inc();
}

pub fn increment_errors() {
    ERRORS.inc();
}

pub fn increment_connection_errors() {
    CONNECTION_ERRORS.inc();
}

/// Initialize Prometheus metrics server
pub async fn init_metrics_server(port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    info!("Starting metrics server on http://{}", addr);

    let make_svc = make_service_fn(|_conn| {
        async {
            Ok::<_, Infallible>(service_fn(|_req| async {
                Ok::<_, Infallible>(metrics_handler())
            }))
        }
    });

    let server = Server::bind(&addr).serve(make_svc);

    // Run server in background
    tokio::spawn(async move {
        if let Err(e) = server.await {
            error!("Metrics server error: {}", e);
        }
    });

    Ok(())
}

/// Metrics HTTP handler
async fn metrics_handler() -> Result<Response<Body>, Infallible> {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();

    let mut buffer = Vec::new();
    if let Err(e) = encoder.encode(&metric_families, &mut buffer) {
        error!("Failed to encode metrics: {}", e);
        return Ok(Response::builder()
            .status(500)
            .body(Body::from("Failed to encode metrics"))
            .unwrap());
    }

    Ok(Response::builder()
        .status(200)
        .header("Content-Type", encoder.format_type())
        .body(Body::from(buffer))
        .unwrap())
}

/// Timing helper for observing processing time
pub struct Timer {
    start: Instant,
    histogram: &'static Histogram,
}

impl Timer {
    pub fn new(histogram: &'static Histogram) -> Self {
        Timer {
            start: Instant::now(),
            histogram,
        }
    }
}

impl Drop for Timer {
    fn drop(&mut self) {
        let duration = self.start.elapsed().as_secs_f64();
        self.histogram.observe(duration);
    }
}
