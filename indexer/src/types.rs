use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub seqno: u32,
    pub gen_utime: u32,
    pub gen_whash: String,
    pub file_hash: String,
    pub transactions: Vec<Transaction>,
    pub now: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub hash: String,
    pub block_seqno: u32,
    pub utime: u32,
    pub source_address: String,
    pub destination_address: String,
    pub message_body: Vec<u8>,
    pub value: u64,
    pub lt: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftEvent {
    pub event_type: String,
    pub transaction_hash: String,
    pub nft_address: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: u64,
    pub timestamp: u32,
    pub block_number: u32,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplaceEvent {
    pub event_type: String,
    pub transaction_hash: String,
    pub marketplace_address: String,
    pub nft_address: String,
    pub seller_address: String,
    pub buyer_address: String,
    pub price: u64,
    pub marketplace_fee: u64,
    pub royalty_fee: u64,
    pub timestamp: u32,
    pub block_number: u32,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuctionEvent {
    pub event_type: String,
    pub transaction_hash: String,
    pub auction_address: String,
    pub nft_address: String,
    pub seller_address: String,
    pub bidder_address: String,
    pub bid_amount: u64,
    pub start_price: u64,
    pub end_time: u32,
    pub timestamp: u32,
    pub block_number: u32,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfferEvent {
    pub event_type: String,
    pub transaction_hash: String,
    pub offer_address: String,
    pub nft_address: String,
    pub maker_address: String,
    pub taker_address: String,
    pub amount: u64,
    pub expires_at: u32,
    pub timestamp: u32,
    pub block_number: u32,
    pub metadata: serde_json::Value,
}
