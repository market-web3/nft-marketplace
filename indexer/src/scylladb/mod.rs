use anyhow::Result;
use chrono::{DateTime, Utc};
use scylla::{batch::Batch, statement::query, CachingSession, Session, SessionBuilder};
use std::sync::Arc;
use tracing::{debug, error, info};

use crate::types::{Block, NftEvent};

pub struct ScyllaDBClient {
    session: Arc<Session>,
    caching_session: Arc<CachingSession>,
}

impl ScyllaDBClient {
    pub async fn new(config: &ScyllaConfig) -> Result<Self> {
        info!("Connecting to ScyllaDB at {}...", config.nodes.join(", "));

        let session: Session = SessionBuilder::new()
            .known_nodes(&config.nodes)
            .user(config.username.as_deref().unwrap_or(""))
            .password(config.password.as_deref().unwrap_or(""))
            .compression(scylla::transport::Compression::Snappy)
            .build()
            .await?;

        let caching_session = Arc::new(CachingSession::new(session.clone(), Default::default()));

        info!("Connected to ScyllaDB successfully");

        Ok(ScyllaDBClient {
            session: Arc::new(session),
            caching_session,
        })
    }

    /// Initialize database schema
    pub async fn initialize_schema(&self) -> Result<()> {
        info!("Initializing ScyllaDB schema...");

        // Create keyspace
        self.session.query(
            query(
                r#"
                CREATE KEYSPACE IF NOT EXISTS ton_nft_marketplace
                WITH replication = {
                    'class': 'NetworkTopologyStrategy',
                    'replication_factor': 3
                }
                AND durable_writes = true
                "#,
            ),
            &(),
        )
        .await?;

        // Create raw transactions table
        self.session
            .query(
                query(
                    r#"
                    CREATE TABLE IF NOT EXISTS ton_nft_marketplace.raw_transactions (
                        tx_hash text PRIMARY KEY,
                        block_seqno bigint,
                        utime bigint,
                        source_address text,
                        destination_address text,
                        message_body blob,
                        value bigint,
                        lt bigint,
                        now bigint,
                        updated_at timestamp
                    ) WITH CLUSTERING ORDER BY (block_seqno DESC, lt DESC)
                    AND gc_grace_seconds = 864000
                    "#,
                ),
                &(),
            )
            .await?;

        // Create NFT events table
        self.session
            .query(
                query(
                    r#"
                    CREATE TABLE IF NOT EXISTS ton_nft_marketplace.nft_events (
                        event_type text,
                        block_seqno bigint,
                        tx_hash text,
                        nft_address text,
                        from_address text,
                        to_address text,
                        amount bigint,
                        utime bigint,
                        metadata text,
                        PRIMARY KEY ((event_type, block_seqno), tx_hash)
                    ) WITH CLUSTERING ORDER BY (tx_hash DESC)
                    AND gc_grace_seconds = 864000
                    "#,
                ),
                &(),
            )
            .await?;

        // Create blocks table
        self.session
            .query(
                query(
                    r#"
                    CREATE TABLE IF NOT EXISTS ton_nft_marketplace.blocks (
                        seqno bigint PRIMARY KEY,
                        gen_utime bigint,
                        gen_whash text,
                        file_hash text,
                        now bigint,
                        updated_at timestamp
                    )
                    "#,
                ),
                &(),
            )
            .await?;

        // Create secondary indexes
        self.session
            .query(
                query(
                    r#"
                    CREATE INDEX IF NOT EXISTS ON ton_nft_marketplace.nft_events (nft_address)
                    "#,
                ),
                &(),
            )
            .await?;

        self.session
            .query(
                query(
                    r#"
                    CREATE INDEX IF NOT EXISTS ON ton_nft_marketplace.nft_events (from_address)
                    "#,
                ),
                &(),
            )
            .await?;

        self.session
            .query(
                query(
                    r#"
                    CREATE INDEX IF NOT EXISTS ON ton_nft_marketplace.nft_events (to_address)
                    "#,
                ),
                &(),
            )
            .await?;

        info!("ScyllaDB schema initialized successfully");
        Ok(())
    }

    /// Store raw transaction data
    pub async fn store_raw_transaction(&self, tx_hash: &str, tx_data: &str) -> Result<()> {
        debug!("Storing raw transaction: {}", tx_hash);

        let query = query(
            r#"
            INSERT INTO ton_nft_marketplace.raw_transactions
            (tx_hash, block_seqno, utime, source_address, destination_address, message_body, value, lt, now, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, toTimestamp(now()))
            "#,
        );

        // Parse transaction data from JSON
        let tx: serde_json::Value = serde_json::from_str(tx_data)?;
        let block_seqno = tx["block_seqno"].as_i64().unwrap_or(0);
        let utime = tx["utime"].as_i64().unwrap_or(0);
        let source_address = tx["source_address"].as_str().unwrap_or("");
        let destination_address = tx["destination_address"].as_str().unwrap_or("");
        let message_body = base64::decode(tx["message_body"].as_str().unwrap_or(""))?;
        let value = tx["value"].as_i64().unwrap_or(0);
        let lt = tx["lt"].as_i64().unwrap_or(0);

        self.session
            .query(
                query,
                (
                    tx_hash,
                    block_seqno,
                    utime,
                    source_address,
                    destination_address,
                    message_body,
                    value,
                    lt,
                    chrono::Utc::now().timestamp(),
                ),
            )
            .await?;

        Ok(())
    }

    /// Store NFT event
    pub async fn store_nft_event(&self, event: &NftEvent) -> Result<()> {
        debug!("Storing NFT event: {}", event.event_type);

        let query = query(
            r#"
            INSERT INTO ton_nft_marketplace.nft_events
            (event_type, block_seqno, tx_hash, nft_address, from_address, to_address, amount, utime, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        );

        let metadata = serde_json::to_string(&event.metadata)?;

        self.session
            .query(
                query,
                (
                    event.event_type.as_str(),
                    event.block_number as i64,
                    event.transaction_hash.as_str(),
                    event.nft_address.as_str(),
                    event.from_address.as_str(),
                    event.to_address.as_str(),
                    event.amount as i64,
                    event.timestamp as i64,
                    metadata.as_str(),
                ),
            )
            .await?;

        Ok(())
    }

    /// Store block metadata
    pub async fn store_block_metadata(&self, block: &Block) -> Result<()> {
        debug!("Storing block metadata: {}", block.seqno);

        let query = query(
            r#"
            INSERT INTO ton_nft_marketplace.blocks
            (seqno, gen_utime, gen_whash, file_hash, now, updated_at)
            VALUES (?, ?, ?, ?, ?, toTimestamp(now()))
            "#,
        );

        self.session
            .query(
                query,
                (
                    block.seqno as i64,
                    block.gen_utime as i64,
                    block.gen_whash.as_str(),
                    block.file_hash.as_str(),
                    chrono::Utc::now().timestamp(),
                ),
            )
            .await?;

        Ok(())
    }

    /// Query NFT events by address
    pub async fn query_nft_events(
        &self,
        nft_address: &str,
        limit: i32,
    ) -> Result<Vec<NftEvent>> {
        debug!("Querying NFT events for address: {}", nft_address);

        let query = query(
            r#"
            SELECT event_type, block_seqno, tx_hash, nft_address, from_address, to_address, amount, utime, metadata
            FROM ton_nft_marketplace.nft_events
            WHERE nft_address = ?
            LIMIT ?
            "#,
        );

        let mut result_set = self.session.query(query, (nft_address, limit)).await?;

        let mut events = Vec::new();

        while let Some(row) = result_set.next_row()? {
            events.push(NftEvent {
                event_type: row.columns[0].as_ref().map(|s| s.as_str()).unwrap_or("").to_string(),
                transaction_hash: row.columns[2].as_ref().map(|s| s.as_str()).unwrap_or("").to_string(),
                nft_address: row.columns[3].as_ref().map(|s| s.as_str()).unwrap_or("").to_string(),
                from_address: row.columns[4].as_ref().map(|s| s.as_str()).unwrap_or("").to_string(),
                to_address: row.columns[5].as_ref().map(|s| s.as_str()).unwrap_or("").to_string(),
                amount: row.columns[6].as_ref().map(|i| i.as_i64()).unwrap_or(0) as u64,
                timestamp: row.columns[7].as_ref().map(|i| i.as_i64()).unwrap_or(0) as u32,
                block_number: row.columns[1].as_ref().map(|i| i.as_i64()).unwrap_or(0) as u32,
                metadata: serde_json::from_str(row.columns[8].as_ref().map(|s| s.as_str()).unwrap_or("{}"))?,
            });
        }

        Ok(events)
    }
}

#[derive(Clone, Debug)]
pub struct ScyllaConfig {
    pub nodes: Vec<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

impl Default for ScyllaConfig {
    fn default() -> Self {
        ScyllaConfig {
            nodes: vec!["127.0.0.1:9042".to_string()],
            username: None,
            password: None,
        }
    }
}
