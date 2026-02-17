"""
AI Embeddings Service for NFT Marketplace
Generates vector embeddings for NFT images and metadata
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from PIL import Image
import torch
import clip
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import logging
from redis import asyncio as aioredis
import os
import io

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/nft_marketplace")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CLIP_MODEL = os.getenv("CLIP_MODEL", "ViT-B/32")
EMBEDDING_DIM = 512

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="NFT Embeddings Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
device = "cuda" if torch.cuda.is_available() else "cpu"
model = None
preprocess = None
redis = None
engine = None

class EmbeddingRequest(BaseModel):
    """Request for generating embeddings from text"""
    text: str
    nft_id: Optional[int] = None

class ImageEmbeddingRequest(BaseModel):
    """Request for generating embeddings from image URL"""
    image_url: str
    nft_id: Optional[int] = None

class BatchEmbeddingRequest(BaseModel):
    """Request for batch embedding generation"""
    texts: List[str]
    nft_ids: Optional[List[int]] = None

class SearchRequest(BaseModel):
    """Request for semantic search"""
    query: str
    limit: int = 10
    collection_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

class EmbeddingResponse(BaseModel):
    """Response with embedding data"""
    embedding: List[float]
    nft_id: Optional[int] = None
    dimension: int

class SearchResponse(BaseModel):
    """Response for semantic search results"""
    results: List[dict]
    query_embedding: List[float]
    total: int

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global model, preprocess, redis, engine

    logger.info("Starting NFT Embeddings Service...")

    # Load CLIP model
    logger.info(f"Loading CLIP model: {CLIP_MODEL} on {device}")
    model, preprocess = clip.load(CLIP_MODEL, device=device)
    model.eval()
    logger.info("CLIP model loaded successfully")

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

def generate_text_embedding(text: str) -> np.ndarray:
    """Generate embedding from text using CLIP"""
    text_tokens = clip.tokenize([text], truncate=True).to(device)
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
    return text_features.cpu().numpy()[0]

def generate_image_embedding(image: Image.Image) -> np.ndarray:
    """Generate embedding from image using CLIP"""
    image_input = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        image_features = model.encode_image(image_input)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
    return image_features.cpu().numpy()[0]

async def cache_embedding(key: str, embedding: np.ndarray, ttl: int = 86400):
    """Cache embedding in Redis"""
    await redis.setex(
        f"embedding:{key}",
        ttl,
        embedding.tobytes()
    )

async def get_cached_embedding(key: str) -> Optional[np.ndarray]:
    """Get cached embedding from Redis"""
    data = await redis.get(f"embedding:{key}")
    if data:
        return np.frombuffer(data, dtype=np.float32)
    return None

async def save_embedding_to_db(nft_id: int, embedding: np.ndarray):
    """Save embedding to PostgreSQL with pgvector"""
    async with AsyncSession(engine) as session:
        await session.execute(
            text("""
                UPDATE nfts
                SET embedding = :embedding,
                    embedding_updated_at = NOW()
                WHERE id = :nft_id
            """),
            {"embedding": embedding.tolist(), "nft_id": nft_id}
        )
        await session.commit()

async def search_similar_embeddings(query_embedding: np.ndarray, limit: int = 10) -> List[dict]:
    """Search for similar NFTs using vector similarity"""
    async with AsyncSession(engine) as session:
        result = await session.execute(
            text("""
                SELECT
                    id, name, description, image_url, price, collection_id,
                    1 - (embedding <=> :query) AS similarity
                FROM nfts
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> :query
                LIMIT :limit
            """),
            {"query": query_embedding.tolist(), "limit": limit}
        )
        rows = result.fetchall()

        return [
            {
                "nft_id": row[0],
                "name": row[1],
                "description": row[2],
                "image_url": row[3],
                "price": float(row[4]),
                "collection_id": row[5],
                "similarity": float(row[6])
            }
            for row in rows
        ]

@app.post("/embeddings/text")
async def create_text_embedding(request: EmbeddingRequest) -> EmbeddingResponse:
    """Generate embedding from text"""
    try:
        # Check cache first
        cache_key = f"text:{hash(request.text)}"
        cached = await get_cached_embedding(cache_key)
        if cached is not None:
            logger.info(f"Returning cached embedding for text hash: {hash(request.text)}")
            return EmbeddingResponse(
                embedding=cached.tolist(),
                nft_id=request.nft_id,
                dimension=len(cached)
            )

        # Generate embedding
        embedding = generate_text_embedding(request.text)

        # Cache embedding
        await cache_embedding(cache_key, embedding)

        # Save to database if nft_id provided
        if request.nft_id:
            await save_embedding_to_db(request.nft_id, embedding)

        return EmbeddingResponse(
            embedding=embedding.tolist(),
            nft_id=request.nft_id,
            dimension=len(embedding)
        )

    except Exception as e:
        logger.error(f"Error generating text embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embeddings/image")
async def create_image_embedding(file: UploadFile = File(...), nft_id: Optional[int] = None):
    """Generate embedding from uploaded image"""
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Check cache
        cache_key = f"image:{hash(contents)}"
        cached = await get_cached_embedding(cache_key)
        if cached is not None:
            logger.info(f"Returning cached embedding for image")
            return EmbeddingResponse(
                embedding=cached.tolist(),
                nft_id=nft_id,
                dimension=len(cached)
            )

        # Generate embedding
        embedding = generate_image_embedding(image)

        # Cache embedding
        await cache_embedding(cache_key, embedding)

        # Save to database if nft_id provided
        if nft_id:
            await save_embedding_to_db(nft_id, embedding)

        return EmbeddingResponse(
            embedding=embedding.tolist(),
            nft_id=nft_id,
            dimension=len(embedding)
        )

    except Exception as e:
        logger.error(f"Error generating image embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embeddings/batch")
async def create_batch_embeddings(request: BatchEmbeddingRequest) -> List[EmbeddingResponse]:
    """Generate embeddings for multiple texts in batch"""
    try:
        responses = []

        for i, text in enumerate(request.texts):
            nft_id = request.nft_ids[i] if request.nft_ids and i < len(request.nft_ids) else None

            # Check cache
            cache_key = f"text:{hash(text)}"
            cached = await get_cached_embedding(cache_key)

            if cached is not None:
                responses.append(EmbeddingResponse(
                    embedding=cached.tolist(),
                    nft_id=nft_id,
                    dimension=len(cached)
                ))
                continue

            # Generate embedding
            embedding = generate_text_embedding(text)

            # Cache embedding
            await cache_embedding(cache_key, embedding)

            # Save to database if nft_id provided
            if nft_id:
                await save_embedding_to_db(nft_id, embedding)

            responses.append(EmbeddingResponse(
                embedding=embedding.tolist(),
                nft_id=nft_id,
                dimension=len(embedding)
            ))

        return responses

    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def semantic_search(request: SearchRequest) -> SearchResponse:
    """Perform semantic search for NFTs"""
    try:
        # Generate query embedding
        query_embedding = generate_text_embedding(request.query)

        # Search for similar embeddings
        results = await search_similar_embeddings(query_embedding, request.limit)

        # Filter by collection if specified
        if request.collection_id:
            results = [r for r in results if r.get("collection_id") == request.collection_id]

        # Filter by price range if specified
        if request.min_price is not None:
            results = [r for r in results if r.get("price", 0) >= request.min_price]
        if request.max_price is not None:
            results = [r for r in results if r.get("price", 0) <= request.max_price]

        return SearchResponse(
            results=results[:request.limit],
            query_embedding=query_embedding.tolist(),
            total=len(results)
        )

    except Exception as e:
        logger.error(f"Error performing semantic search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": CLIP_MODEL,
        "device": device,
        "redis": "connected" if redis else "disconnected",
        "postgres": "connected" if engine else "disconnected"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "NFT Embeddings Service",
        "version": "1.0.0",
        "model": CLIP_MODEL,
        "embedding_dim": EMBEDDING_DIM
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
