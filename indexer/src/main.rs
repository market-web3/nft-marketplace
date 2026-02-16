use anyhow::Result;
use config::{Config, ConfigError, Environment, File};
use governor::{Quota, RateLimiter};
use std::net::SocketAddr;
use std::num::NonZeroU32;
use std::sync::Arc;
use std::time::Duration;
use tokio::signal;
use tracing::{error, info, warn};
use tracing_appender::rolling;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod kafka;
mod parser;
mod scylladb;
mod metrics;
mod config as app_config;
mod types;

use app_config::IndexerConfig;
use kafka::KafkaProducer;
use parser::{BlockParser, NftEventParser};
use scylladb::ScyllaDBClient;
use types::{Block, NftEvent, MarketplaceEvent};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    let file_appender = rolling::daily("logs", "indexer.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .with(fmt::layer().with_writer(std::io::stdout))
        .with(fmt::layer().with_writer(non_blocking))
        .init();

    info!("Starting TON NFT Indexer...");

    // Load configuration
    let config = load_config()?;

    // Initialize components
    let scylla_client = ScyllaDBClient::new(&config.scylla).await?;
    let kafka_producer = KafkaProducer::new(&config.kafka)?;
    let block_parser = Arc::new(BlockParser::new(config.parser.clone()));
    let nft_event_parser = Arc::new(NftEventParser::new());

    // Initialize metrics
    metrics::init_metrics_server(config.metrics_port).await?;

    // Setup rate limiter
    let quota = Quota::per_second(NonZeroU32::new(1000).unwrap());
    let rate_limiter = Arc::new(RateLimiter::direct(quota));

    // Start indexing loop
    info!("Starting indexing loop...");

    let mut block_seqno = config.start_block_seqno;
    let mut consecutive_errors = 0;
    let max_errors = config.max_consecutive_errors;

    // Main indexing loop
    loop {
        // Check for shutdown signal
        if tokio::signal::ctrl_c().await.is_ok() {
            info!("Received shutdown signal, graceful shutdown...");
            break;
        }

        // Fetch block
        match fetch_block(&config.ton_api_url, block_seqno).await {
            Ok(block) => {
                consecutive_errors = 0;

                info!("Processing block #{}", block.seqno);

                // Parse block for NFT events
                match parse_block(&block, &block_parser, &nft_event_parser).await {
                    Ok(events) => {
                        info!("Found {} events in block #{}", events.len(), block.seqno);

                        // Process events
                        for event in events {
                            if let Err(e) = process_event(event, &scylla_client, &kafka_producer).await {
                                error!("Failed to process event: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to parse block #{}: {}", block.seqno, e);
                    }
                }

                // Store block metadata
                if let Err(e) = store_block_metadata(&block, &scylla_client).await {
                    error!("Failed to store block metadata: {}", e);
                }

                block_seqno += 1;

                // Update metrics
                metrics::increment_blocks_processed();
                metrics::set_current_block(block_seqno);
            }
            Err(e) => {
                consecutive_errors += 1;
                error!("Failed to fetch block #{}: {}", block_seqno, e);

                if consecutive_errors >= max_errors {
                    error!("Too many consecutive errors ({}), shutting down", consecutive_errors);
                    break;
                }

                // Exponential backoff
                let backoff = Duration::from_secs(2u64.pow(consecutive_errors as u32).min(60));
                tokio::time::sleep(backoff).await;
            }
        }

        // Rate limiting
        tokio::time::sleep(Duration::from_millis(config.poll_interval_ms)).await;
    }

    info!("Indexer shutdown complete");
    Ok(())
}

/// Load configuration from file and environment
fn load_config() -> Result<IndexerConfig, ConfigError> {
    let mut settings = Config::builder()
        .add_source(File::with_name("config/config"))
        .add_source(Environment::with_prefix("INDEXER").separator("__"))
        .build()?;

    settings.try_deserialize()
}

/// Fetch block from TON API
async fn fetch_block(api_url: &str, seqno: u32) -> Result<Block> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;

    let url = format!("{}/blocks/{}", api_url, seqno);
    let response = client.get(&url).send().await?;

    if !response.status().is_success() {
        anyhow::bail!("Failed to fetch block: {}", response.status());
    }

    let block: Block = response.json().await?;
    Ok(block)
}

/// Parse block for NFT and marketplace events
async fn parse_block(
    block: &Block,
    block_parser: &Arc<BlockParser>,
    nft_event_parser: &Arc<NftEventParser>,
) -> Result<Vec<NftEvent>> {
    let mut events = Vec::new();

    // Parse transactions
    for transaction in &block.transactions {
        // Parse NFT transfers
        if let Some(nft_event) = block_parser.parse_nft_transfer(transaction).await? {
            events.push(nft_event);
        }

        // Parse marketplace events
        if let Some(marketplace_event) = nft_event_parser.parse_marketplace_event(transaction).await? {
            events.push(marketplace_event);
        }

        // Parse auction events
        if let Some(auction_event) = nft_event_parser.parse_auction_event(transaction).await? {
            events.push(auction_event);
        }
    }

    Ok(events)
}

/// Process and store event
async fn process_event(
    event: NftEvent,
    scylla: &ScyllaDBClient,
    kafka: &KafkaProducer,
) -> Result<()> {
    // Store in ScyllaDB (write-optimized)
    scylla.store_raw_event(&event).await?;

    // Publish to Kafka for processing
    kafka.publish_event(&event).await?;

    // Update metrics
    metrics::increment_events_processed(event.event_type.as_str());

    Ok(())
}

/// Store block metadata in ScyllaDB
async fn store_block_metadata(block: &Block, scylla: &ScyllaDBClient) -> Result<()> {
    scylla.store_block_metadata(block).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_loading() {
        // Test configuration loading
        // This would load a test config file
    }

    #[tokio::test]
    async fn test_block_parsing() {
        // Test block parsing logic
    }
}
