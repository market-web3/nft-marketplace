use anyhow::Result;
use rdkafka::config::ClientConfig;
use rdkafka::message::OwnedHeaders;
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::util::Timeout;
use std::time::Duration;
use tracing::{debug, error, info};

use crate::types::NftEvent;

pub struct KafkaProducer {
    producer: FutureProducer,
}

impl KafkaProducer {
    pub fn new(config: &KafkaConfig) -> Result<Self> {
        info!("Initializing Kafka producer...");

        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &config.bootstrap_servers)
            .set("message.timeout.ms", "5000")
            .set("request.timeout.ms", "10000")
            .set("security.protocol", &config.security_protocol)
            .set("sasl.mechanism", &config.sasl_mechanism)
            .set("sasl.username", &config.sasl_username)
            .set("sasl.password", &config.sasl_password)
            .set("enable.idempotence", "true")
            .set("acks", "all")
            .set("retries", "3")
            .set("compression.type", "snappy")
            .create()?;

        info!("Kafka producer initialized successfully");
        Ok(KafkaProducer { producer })
    }

    /// Publish NFT event to Kafka
    pub async fn publish_event(&self, event: &NftEvent) -> Result<()> {
        let topic = self.get_topic_for_event(&event.event_type);

        let payload = serde_json::to_string(event)?;
        let key = format!("{}:{}", event.event_type, event.transaction_hash);

        debug!("Publishing event to topic {}: {}", topic, key);

        let headers = OwnedHeaders::new()
            .add("event_type", event.event_type.as_str())
            .add("block_number", event.block_number.to_string().as_str())
            .add("timestamp", event.timestamp.to_string().as_str());

        let record = FutureRecord::to(&topic)
            .key(&key)
            .payload(&payload)
            .headers(headers)
            .timestamp(event.timestamp as i64);

        match self.producer.send(record, Timeout::After(Duration::from_secs(5))).await {
            Ok((partition, offset)) => {
                debug!("Event published to {} at partition {}, offset {}", topic, partition, offset);
                Ok(())
            }
            Err((e, _)) => {
                error!("Failed to publish event: {}", e);
                Err(e.into())
            }
        }
    }

    /// Publish raw transaction data
    pub async fn publish_raw_transaction(&self, tx_hash: &str, tx_data: &str) -> Result<()> {
        let topic = "ton.raw_transactions";

        debug!("Publishing raw transaction {} to topic {}", tx_hash, topic);

        let record = FutureRecord::to(topic)
            .key(tx_hash)
            .payload(tx_data);

        match self.producer.send(record, Timeout::After(Duration::from_secs(5))).await {
            Ok((partition, offset)) => {
                debug!("Raw transaction published at partition {}, offset {}", partition, offset);
                Ok(())
            }
            Err((e, _)) => {
                error!("Failed to publish raw transaction: {}", e);
                Err(e.into())
            }
        }
    }

    /// Determine topic based on event type
    fn get_topic_for_event(&self, event_type: &str) -> &str {
        match event_type {
            "nft_transfer" => "ton.nft_events",
            "create_sale" | "buy_item" | "cancel_sale" => "ton.marketplace_events",
            "create_auction" | "place_bid" | "end_auction" => "ton.auction_events",
            "create_offer" | "accept_offer" | "cancel_offer" => "ton.offer_events",
            _ => "ton.all_events",
        }
    }
}

#[derive(Clone, Debug)]
pub struct KafkaConfig {
    pub bootstrap_servers: String,
    pub security_protocol: String,
    pub sasl_mechanism: String,
    pub sasl_username: String,
    pub sasl_password: String,
}

impl Default for KafkaConfig {
    fn default() -> Self {
        KafkaConfig {
            bootstrap_servers: "localhost:9092".to_string(),
            security_protocol: "PLAINTEXT".to_string(),
            sasl_mechanism: "".to_string(),
            sasl_username: "".to_string(),
            sasl_password: "".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_topic_selection() {
        let producer = KafkaProducer::new(&KafkaConfig::default()).unwrap();

        assert_eq!(producer.get_topic_for_event("nft_transfer"), "ton.nft_events");
        assert_eq!(producer.get_topic_for_event("create_sale"), "ton.marketplace_events");
        assert_eq!(producer.get_topic_for_event("create_auction"), "ton.auction_events");
        assert_eq!(producer.get_topic_for_event("create_offer"), "ton.offer_events");
    }
}
