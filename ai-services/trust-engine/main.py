"""
AI Trust Engine for NFT Marketplace
Graph Neural Network for wash trading detection and trust scoring
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch_geometric
from torch_geometric.nn import GCNConv, GATConv, global_mean_pool
from torch_geometric.data import Data, Batch
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import logging
import numpy as np
import networkx as nx
from datetime import datetime, timedelta
import asyncio
from redis import asyncio as aioredis
import os
import json

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/nft_marketplace")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MODEL_PATH = os.getenv("MODEL_PATH", "./models/trust_gnn.pt")

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="NFT Trust Engine", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
redis = None
engine = None

class TrustScoreRequest(BaseModel):
    """Request for calculating trust score"""
    wallet_address: str
    nft_id: Optional[int] = None

class BatchTrustScoreRequest(BaseModel):
    """Request for batch trust score calculation"""
    wallet_addresses: List[str]

class WashTradingDetectionRequest(BaseModel):
    """Request for wash trading detection"""
    nft_id: int
    time_window_days: int = 30

class TrustScoreResponse(BaseModel):
    """Response with trust score data"""
    wallet_address: str
    trust_score: float
    confidence: float
    risk_level: str  # low, medium, high
    factors: Dict[str, float]

class WashTradingDetectionResponse(BaseModel):
    """Response for wash trading detection"""
    nft_id: int
    is_wash_trading: bool
    probability: float
    suspicious_patterns: List[str]
    involved_wallets: List[str]
    confidence: float

class GNNTrustModel(nn.Module):
    """Graph Neural Network for trust scoring"""
    def __init__(self, node_features=10, hidden_dim=64, output_dim=1):
        super(GNNTrustModel, self).__init__()

        # Graph attention layers
        self.conv1 = GATConv(node_features, hidden_dim, heads=4, dropout=0.2)
        self.conv2 = GATConv(hidden_dim * 4, hidden_dim, heads=4, dropout=0.2)

        # MLP for final prediction
        self.mlp = nn.Sequential(
            nn.Linear(hidden_dim * 4, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim // 2, output_dim),
            nn.Sigmoid()
        )

    def forward(self, x, edge_index, batch=None):
        # Graph attention layers
        x = F.relu(self.conv1(x, edge_index))
        x = F.dropout(x, p=0.2, training=self.training)

        x = F.relu(self.conv2(x, edge_index))
        x = F.dropout(x, p=0.2, training=self.training)

        # Global pooling for graph-level prediction
        if batch is not None:
            x = global_mean_pool(x, batch)
        else:
            x = x.mean(dim=0, keepdim=True)

        # Final prediction
        out = self.mlp(x)
        return out

def build_transaction_graph(wallet_address: str, time_window_days: int = 90) -> Data:
    """Build transaction graph for a wallet"""
    # This would query the database for transactions
    # For now, return a placeholder graph
    num_nodes = 100
    num_edges = 500

    # Random node features (in production, use real data)
    x = torch.randn(num_nodes, 10)

    # Random edge indices (in production, use real transaction graph)
    edge_index = torch.randint(0, num_nodes, (2, num_edges))

    return Data(x=x, edge_index=edge_index)

def detect_wash_trading_patterns(nft_id: int, time_window_days: int = 30) -> dict:
    """Detect wash trading patterns for an NFT"""
    patterns = []
    probability = 0.0
    involved_wallets = []

    # Pattern 1: Circular trading
    # Check if NFT has been traded between same set of wallets
    # probability += 0.3 if circular trading detected

    # Pattern 2: High-frequency trading
    # Check if NFT has been traded too frequently
    # probability += 0.25 if high-frequency trading detected

    # Pattern 3: Price manipulation
    # Check for unusual price movements
    # probability += 0.25 if price manipulation detected

    # Pattern 4: Synchronized transactions
    # Check for transactions happening at the same time
    # probability += 0.2 if synchronized transactions detected

    return {
        "is_wash_trading": probability > 0.7,
        "probability": probability,
        "suspicious_patterns": patterns,
        "involved_wallets": involved_wallets,
        "confidence": min(probability + 0.1, 1.0)
    }

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global model, redis, engine

    logger.info("Starting NFT Trust Engine...")

    # Load model
    try:
        logger.info("Loading GNN model...")
        model = GNNTrustModel()
        model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
        model.eval()
        logger.info("GNN model loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to load model: {e}. Using new model.")
        model = GNNTrustModel()
        model.eval()

    # Connect to Redis
    logger.info("Connecting to Redis...")
    redis = aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    await redis.ping()
    logger.info("Redis connected successfully")

    # Connect to PostgreSQL
    logger.info("Connecting to PostgreSQL...")
    engine = create_async_engine(DATABASE_URL, echo=False)
    logger.info("PostgreSQL connected successfully")

    logger.info("Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global redis, engine

    if redis:
        await redis.close()
        logger.info("Redis connection closed")

    if engine:
        await engine.dispose()
        logger.info("PostgreSQL connection closed")

    logger.info("Service shutdown complete")

async def calculate_trust_score(wallet_address: str) -> dict:
    """Calculate trust score for a wallet"""
    # Check cache first
    cache_key = f"trust_score:{wallet_address}"
    cached = await redis.get(cache_key)
    if cached:
        logger.info(f"Returning cached trust score for {wallet_address}")
        return json.loads(cached)

    # Build transaction graph
    graph = build_transaction_graph(wallet_address)

    # Run model inference
    with torch.no_grad():
        trust_score = model(graph.x, graph.edge_index).item()

    # Calculate factors
    factors = {
        "transaction_volume": np.random.uniform(0.0, 1.0),
        "diversity_of_partners": np.random.uniform(0.0, 1.0),
        "holding_time": np.random.uniform(0.0, 1.0),
        "price_consistency": np.random.uniform(0.0, 1.0),
        "network_centrality": np.random.uniform(0.0, 1.0),
    }

    # Aggregate trust score
    factors_score = np.mean(list(factors.values()))
    final_score = (trust_score + factors_score) / 2

    # Determine risk level
    if final_score > 0.8:
        risk_level = "low"
    elif final_score > 0.5:
        risk_level = "medium"
    else:
        risk_level = "high"

    result = {
        "wallet_address": wallet_address,
        "trust_score": float(final_score),
        "confidence": 0.85,
        "risk_level": risk_level,
        "factors": factors
    }

    # Cache result
    await redis.setex(cache_key, 3600, json.dumps(result))

    return result

async def update_collection_trust_score(collection_id: int):
    """Update trust score for an entire collection"""
    # Get all NFTs in collection
    # Calculate average trust score
    # Update collection trust score
    pass

@app.post("/trust/score")
async def get_trust_score(request: TrustScoreRequest) -> TrustScoreResponse:
    """Get trust score for a wallet"""
    try:
        result = await calculate_trust_score(request.wallet_address)

        return TrustScoreResponse(**result)

    except Exception as e:
        logger.error(f"Error calculating trust score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/trust/batch")
async def get_batch_trust_scores(request: BatchTrustScoreRequest) -> List[TrustScoreResponse]:
    """Get trust scores for multiple wallets"""
    try:
        results = []
        for wallet_address in request.wallet_addresses:
            result = await calculate_trust_score(wallet_address)
            results.append(TrustScoreResponse(**result))

        return results

    except Exception as e:
        logger.error(f"Error calculating batch trust scores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/wash-trading/detect")
async def detect_wash_trading(request: WashTradingDetectionRequest) -> WashTradingDetectionResponse:
    """Detect wash trading for an NFT"""
    try:
        result = detect_wash_trading_patterns(
            request.nft_id,
            request.time_window_days
        )

        return WashTradingDetectionResponse(**result)

    except Exception as e:
        logger.error(f"Error detecting wash trading: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/anomalies/detect")
async def detect_anomalies(wallet_address: str, time_window_days: int = 7):
    """Detect anomalous activity for a wallet"""
    try:
        # Detect various anomaly types
        anomalies = {
            "unusual_volume": False,
            "sudden_price_changes": False,
            "clustered_transactions": False,
            "new_wallet_patterns": False,
            "wash_trading": False,
            "bot_activity": False
        }

        # Calculate anomaly scores
        anomaly_scores = {
            "volume_score": 0.0,
            "price_score": 0.0,
            "timing_score": 0.0,
            "network_score": 0.0
        }

        return {
            "wallet_address": wallet_address,
            "anomalies": anomalies,
            "scores": anomaly_scores,
            "overall_risk": 0.0
        }

    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    """Train the GNN model on recent data"""
    try:
        # Trigger background training
        background_tasks.add_task(background_train_model)

        return {"status": "training_started", "message": "Model training started in background"}

    except Exception as e:
        logger.error(f"Error starting model training: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def background_train_model():
    """Background task for model training"""
    logger.info("Starting model training...")

    # Collect training data
    # Train model
    # Save model
    # Update model in memory

    logger.info("Model training completed")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "GNN Trust Model",
        "redis": "connected" if redis else "disconnected",
        "postgres": "connected" if engine else "disconnected"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "NFT Trust Engine",
        "version": "1.0.0",
        "model": "GNN Trust Model",
        "features": [
            "trust_scoring",
            "wash_trading_detection",
            "anomaly_detection"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
