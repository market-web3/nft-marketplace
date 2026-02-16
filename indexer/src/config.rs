use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexerConfig {
    pub ton_api_url: String,
    pub start_block_seqno: u32,
    pub poll_interval_ms: u64,
    pub max_consecutive_errors: u32,

    pub parser: ParserConfig,
    pub kafka: KafkaConfig,
    pub scylla: ScyllaConfig,

    pub metrics_port: u16,
    pub log_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParserConfig {
    pub nft_standard_addresses: Vec<String>,
    pub marketplace_address: String,
    pub max_transactions_per_block: usize,
    pub skip_invalid_transactions: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KafkaConfig {
    pub bootstrap_servers: String,
    pub security_protocol: String,
    pub sasl_mechanism: String,
    pub sasl_username: String,
    pub sasl_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScyllaConfig {
    pub nodes: Vec<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}
