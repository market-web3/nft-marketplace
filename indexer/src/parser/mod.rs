use anyhow::{anyhow, Result};
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};

use crate::types::{Block, Transaction, NftEvent, MarketplaceEvent, AuctionEvent, OfferEvent};

/// Block parser interface
#[async_trait]
pub trait BlockParserTrait: Send + Sync {
    async fn parse_nft_transfer(&self, tx: &Transaction) -> Result<Option<NftEvent>>;
    async fn parse_block(&self, block: &Block) -> Result<Vec<NftEvent>>;
}

/// Main block parser implementation
pub struct BlockParser {
    config: ParserConfig,
    nft_contracts: Arc<RwLock<Vec<String>>>,
    marketplace_contracts: Arc<RwLock<Vec<String>>>,
    auction_contracts: Arc<RwLock<Vec<String>>>,
}

#[derive(Clone, Debug)]
pub struct ParserConfig {
    pub nft_standard_addresses: Vec<String>,
    pub marketplace_address: String,
    pub max_transactions_per_block: usize,
    pub skip_invalid_transactions: bool,
}

impl BlockParser {
    pub fn new(config: ParserConfig) -> Self {
        BlockParser {
            config,
            nft_contracts: Arc::new(RwLock::new(Vec::new())),
            marketplace_contracts: Arc::new(RwLock::new(Vec::new())),
            auction_contracts: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Update list of NFT contracts
    pub async fn update_nft_contracts(&self, contracts: Vec<String>) {
        let mut nft_contracts = self.nft_contracts.write().await;
        *nft_contracts = contracts;
        info!("Updated NFT contracts list: {} contracts", nft_contracts.len());
    }

    /// Update list of marketplace contracts
    pub async fn update_marketplace_contracts(&self, contracts: Vec<String>) {
        let mut marketplace_contracts = self.marketplace_contracts.write().await;
        *marketplace_contracts = contracts;
        info!("Updated marketplace contracts list: {} contracts", marketplace_contracts.len());
    }

    /// Check if address is an NFT contract
    async fn is_nft_contract(&self, address: &str) -> bool {
        let nft_contracts = self.nft_contracts.read().await;
        nft_contracts.contains(&address.to_string())
    }

    /// Check if address is a marketplace contract
    async fn is_marketplace_contract(&self, address: &str) -> bool {
        let marketplace_contracts = self.marketplace_contracts.read().await;
        marketplace_contracts.contains(&address.to_string())
            || self.config.marketplace_address == address
    }

    /// Parse operation code from message body
    fn parse_op_code(&self, body: &[u8]) -> Result<u32> {
        if body.len() < 4 {
            return Ok(0);
        }
        let op_code = u32::from_be_bytes([
            body[0], body[1], body[2], body[3]
        ]);
        Ok(op_code)
    }

    /// Extract address from cell data
    fn extract_address(&self, data: &[u8], offset: usize) -> Result<String> {
        if data.len() < offset + 32 {
            return Err(anyhow!("Invalid address data"));
        }

        let addr_bytes = &data[offset..offset + 32];
        let hex_addr = hex::encode(addr_bytes);
        Ok(format!("0:{}", hex_addr))
    }
}

#[async_trait]
impl BlockParserTrait for BlockParser {
    async fn parse_nft_transfer(&self, tx: &Transaction) -> Result<Option<NftEvent>> {
        // Check if transaction involves NFT contract
        if !self.is_nft_contract(&tx.destination_address).await {
            return Ok(None);
        }

        // Parse operation code
        let op_code = self.parse_op_code(&tx.message_body)?;

        // Check for transfer operation (0x5fcc3d14)
        if op_code != 0x5fcc3d14 {
            return Ok(None);
        }

        // Extract transfer details
        let from_address = self.extract_address(&tx.message_body, 4)?;
        let to_address = self.extract_address(&tx.message_body, 36)?;
        let nft_address = tx.source_address.clone();

        let nft_event = NftEvent {
            event_type: "nft_transfer".to_string(),
            transaction_hash: tx.hash.clone(),
            nft_address,
            from_address,
            to_address,
            amount: 1,
            timestamp: tx.utime,
            block_number: tx.block_seqno,
            metadata: serde_json::json!({
                "op_code": format!("0x{:08x}", op_code),
                "source_address": tx.source_address,
                "destination_address": tx.destination_address,
            }),
        };

        debug!("Parsed NFT transfer: {} -> {}", from_address, to_address);
        Ok(Some(nft_event))
    }

    async fn parse_block(&self, block: &Block) -> Result<Vec<NftEvent>> {
        let mut events = Vec::new();

        for tx in &block.transactions {
            if let Some(event) = self.parse_nft_transfer(tx).await? {
                events.push(event);
            }
        }

        Ok(events)
    }
}

/// NFT event parser for marketplace-specific events
pub struct NftEventParser;

impl NftEventParser {
    pub fn new() -> Self {
        NftEventParser
    }

    /// Parse marketplace events
    pub async fn parse_marketplace_event(&self, tx: &Transaction) -> Result<Option<NftEvent>> {
        // Check for marketplace operations
        let op_code = self.parse_op_code(&tx.message_body)?;

        match op_code {
            0x1 => {
                // Create sale
                Ok(Some(NftEvent {
                    event_type: "create_sale".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: "".to_string(),
                    amount: 0,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({
                        "price": self.extract_amount(&tx.message_body, 36)?,
                        "seller": tx.source_address,
                    }),
                }))
            }
            0x2 => {
                // Buy item
                Ok(Some(NftEvent {
                    event_type: "buy_item".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: self.extract_address(&tx.message_body, 36)?,
                    amount: self.extract_amount(&tx.message_body, 68)?,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({}),
                }))
            }
            _ => Ok(None),
        }
    }

    /// Parse auction events
    pub async fn parse_auction_event(&self, tx: &Transaction) -> Result<Option<NftEvent>> {
        let op_code = self.parse_op_code(&tx.message_body)?;

        match op_code {
            0x10 => {
                // Create auction
                Ok(Some(NftEvent {
                    event_type: "create_auction".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: "".to_string(),
                    amount: self.extract_amount(&tx.message_body, 36)?,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({
                        "start_price": self.extract_amount(&tx.message_body, 36)?,
                        "end_time": self.extract_timestamp(&tx.message_body, 68)?,
                    }),
                }))
            }
            0x11 => {
                // Place bid
                Ok(Some(NftEvent {
                    event_type: "place_bid".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: "".to_string(),
                    amount: self.extract_amount(&tx.message_body, 36)?,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({
                        "bidder": tx.source_address,
                    }),
                }))
            }
            0x12 => {
                // End auction
                Ok(Some(NftEvent {
                    event_type: "end_auction".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: "".to_string(),
                    amount: 0,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({}),
                }))
            }
            _ => Ok(None),
        }
    }

    /// Parse offer events
    pub async fn parse_offer_event(&self, tx: &Transaction) -> Result<Option<NftEvent>> {
        let op_code = self.parse_op_code(&tx.message_body)?;

        match op_code {
            0x20 => {
                // Create offer
                Ok(Some(NftEvent {
                    event_type: "create_offer".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: "".to_string(),
                    amount: self.extract_amount(&tx.message_body, 36)?,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({
                        "expires_at": self.extract_timestamp(&tx.message_body, 68)?,
                    }),
                }))
            }
            0x21 => {
                // Accept offer
                Ok(Some(NftEvent {
                    event_type: "accept_offer".to_string(),
                    transaction_hash: tx.hash.clone(),
                    nft_address: self.extract_address(&tx.message_body, 4)?,
                    from_address: tx.source_address.clone(),
                    to_address: self.extract_address(&tx.message_body, 36)?,
                    amount: self.extract_amount(&tx.message_body, 68)?,
                    timestamp: tx.utime,
                    block_number: tx.block_seqno,
                    metadata: serde_json::json!({}),
                }))
            }
            _ => Ok(None),
        }
    }

    /// Parse operation code from message body
    fn parse_op_code(&self, body: &[u8]) -> Result<u32> {
        if body.len() < 4 {
            return Ok(0);
        }
        let op_code = u32::from_be_bytes([body[0], body[1], body[2], body[3]]);
        Ok(op_code)
    }

    /// Extract address from cell data
    fn extract_address(&self, data: &[u8], offset: usize) -> Result<String> {
        if data.len() < offset + 32 {
            return Err(anyhow!("Invalid address data"));
        }
        let addr_bytes = &data[offset..offset + 32];
        let hex_addr = hex::encode(addr_bytes);
        Ok(format!("0:{}", hex_addr))
    }

    /// Extract amount from message body
    fn extract_amount(&self, data: &[u8], offset: usize) -> Result<u64> {
        if data.len() < offset + 8 {
            return Ok(0);
        }
        let amount = u64::from_be_bytes([
            data[offset], data[offset + 1], data[offset + 2], data[offset + 3],
            data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7],
        ]);
        Ok(amount)
    }

    /// Extract timestamp from message body
    fn extract_timestamp(&self, data: &[u8], offset: usize) -> Result<u32> {
        if data.len() < offset + 4 {
            return Ok(0);
        }
        let timestamp = u32::from_be_bytes([
            data[offset], data[offset + 1], data[offset + 2], data[offset + 3],
        ]);
        Ok(timestamp)
    }
}
