"""
AI Service for Yeelo Homeopathy Platform
Handles content generation, forecasting, and automation using AI/ML
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from .database import DatabaseManager
from .ai_models import AIModelManager
from .kafka_consumer import KafkaConsumer
from .embeddings import EmbeddingService
from .rag import RAGService
from .forecasting import DemandForecastingService
from .pricing import DynamicPricingService
from .content_generation import ContentGenerationService
from .agents.ai_agents_orchestrator import AIAgentsOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
db_manager: Optional[DatabaseManager] = None
ai_models: Optional[AIModelManager] = None
kafka_consumer: Optional[KafkaConsumer] = None
embedding_service: Optional[EmbeddingService] = None
rag_service: Optional[RAGService] = None
forecasting_service: Optional[DemandForecastingService] = None
pricing_service: Optional[DynamicPricingService] = None
content_service: Optional[ContentGenerationService] = None
agents_orchestrator: Optional[AIAgentsOrchestrator] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global db_manager, ai_models, kafka_consumer, embedding_service, rag_service
    global forecasting_service, pricing_service, content_service, agents_orchestrator
    
    logger.info("Starting AI Service...")
    
    # Initialize services
    db_manager = DatabaseManager()
    await db_manager.initialize()
    
    ai_models = AIModelManager()
    await ai_models.initialize()
    
    embedding_service = EmbeddingService()
    await embedding_service.initialize()
    
    rag_service = RAGService(embedding_service, db_manager)
    await rag_service.initialize()
    
    forecasting_service = DemandForecastingService(db_manager)
    await forecasting_service.initialize()
    
    pricing_service = DynamicPricingService(db_manager)
    await pricing_service.initialize()
    
    content_service = ContentGenerationService(ai_models, rag_service)
    await content_service.initialize()
    
    # Initialize AI Agents Orchestrator (pass pre-initialized rag_service)
    agents_orchestrator = AIAgentsOrchestrator(
        ai_models=ai_models,
        db_manager=db_manager,
        forecasting_service=forecasting_service,
        rag_service=rag_service,
    )
    
    # Start Kafka consumer (best-effort in dev; don't fail startup if broker not ready)
    kafka_consumer = KafkaConsumer(
        db_manager=db_manager,
        content_service=content_service,
        forecasting_service=forecasting_service,
        pricing_service=pricing_service
    )
    try:
        await kafka_consumer.start()
    except Exception:
        logger.warning("Kafka not available; continuing without consumer in development mode")
    
    logger.info("AI Service started successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Service...")
    if kafka_consumer:
        await kafka_consumer.stop()
    if db_manager:
        await db_manager.close()
    logger.info("AI Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Yeelo AI Service",
    description="AI-powered automation for homeopathy business platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class GenerateRequest(BaseModel):
    model: str = Field(default="llama-13b-instruct", description="Model to use for generation")
    prompt: str = Field(..., description="Input prompt")
    max_tokens: int = Field(default=256, description="Maximum tokens to generate")
    temperature: float = Field(default=0.7, description="Sampling temperature")
    context_documents: Optional[List[str]] = Field(default=None, description="Document IDs for RAG context")
    user_id: Optional[str] = Field(default=None, description="User ID for audit logging")

class GenerateResponse(BaseModel):
    id: str
    text: str
    tokens_used: int
    model: str
    metadata: Optional[Dict[str, Any]] = None

class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., description="Texts to embed")
    model: str = Field(default="embed-small-v1", description="Embedding model to use")

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str

class ForecastRequest(BaseModel):
    product_id: str
    shop_id: str
    days_ahead: int = Field(default=30, ge=1, le=365)
    include_seasonality: bool = Field(default=True)

class ForecastResponse(BaseModel):
    product_id: str
    shop_id: str
    forecasted_quantity: int
    confidence_score: float
    forecast_date: datetime
    factors: Dict[str, float]
    recommendations: List[str]

class PricingRequest(BaseModel):
    product_id: str
    current_price: float
    current_stock: int
    expiry_date: Optional[datetime] = None
    demand_forecast: int = 0
    competitor_prices: Optional[List[float]] = None
    cost_price: float

class PricingResponse(BaseModel):
    product_id: str
    current_price: float
    recommended_price: float
    confidence_score: float
    reasoning: str
    expected_impact: Dict[str, float]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": await db_manager.health_check() if db_manager else False,
            "ai_models": await ai_models.health_check() if ai_models else False,
            "kafka": await kafka_consumer.health_check() if kafka_consumer else False
        }
    }

# AI Generation endpoints
@app.post("/v1/generate", response_model=GenerateResponse)
async def generate_content(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Generate content using AI models with optional RAG context"""
    try:
        # Get RAG context if requested
        context_docs = []
        if request.context_documents:
            context_docs = await rag_service.retrieve_documents(request.context_documents)
        
        # Generate content
        result = await content_service.generate(
            prompt=request.prompt,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            context_documents=context_docs
        )
        
        # Log request for audit
        background_tasks.add_task(
            log_ai_request,
            request=request,
            response=result,
            user_id=request.user_id
        )
        
        return GenerateResponse(
            id=result["id"],
            text=result["text"],
            tokens_used=result["tokens_used"],
            model=result["model"],
            metadata=result.get("metadata")
        )
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/embed", response_model=EmbedResponse)
async def create_embeddings(request: EmbedRequest):
    """Create embeddings for texts"""
    try:
        embeddings = await embedding_service.embed_texts(request.texts, request.model)
        
        return EmbedResponse(
            embeddings=embeddings,
            model=request.model
        )
        
    except Exception as e:
        logger.error(f"Error creating embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Forecasting endpoints
@app.post("/v1/forecast-demand", response_model=ForecastResponse)
async def forecast_demand(request: ForecastRequest):
    """Forecast product demand using AI/ML models"""
    try:
        forecast = await forecasting_service.forecast_demand(
            product_id=request.product_id,
            shop_id=request.shop_id,
            days_ahead=request.days_ahead,
            include_seasonality=request.include_seasonality
        )
        
        return ForecastResponse(**forecast)
        
    except Exception as e:
        logger.error(f"Error forecasting demand: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Pricing endpoints
@app.post("/v1/calculate-pricing", response_model=PricingResponse)
async def calculate_pricing(request: PricingRequest):
    """Calculate optimal pricing using AI"""
    try:
        pricing = await pricing_service.calculate_optimal_pricing(
            product_id=request.product_id,
            current_price=request.current_price,
            current_stock=request.current_stock,
            expiry_date=request.expiry_date,
            demand_forecast=request.demand_forecast,
            competitor_prices=request.competitor_prices,
            cost_price=request.cost_price
        )
        
        return PricingResponse(**pricing)
        
    except Exception as e:
        logger.error(f"Error calculating pricing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Content generation endpoints
@app.post("/v1/generate-campaign")
async def generate_campaign(campaign_data: Dict[str, Any]):
    """Generate marketing campaign content"""
    try:
        campaign = await content_service.generate_campaign(campaign_data)
        return campaign
        
    except Exception as e:
        logger.error(f"Error generating campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/generate-product-description")
async def generate_product_description(product_data: Dict[str, Any]):
    """Generate product description"""
    try:
        description = await content_service.generate_product_description(product_data)
        return {"description": description}
        
    except Exception as e:
        logger.error(f"Error generating product description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Agents endpoints
@app.post("/v1/agents/daily-automation")
async def run_daily_automation(shop_id: str):
    """Run daily AI automation for a shop"""
    try:
        result = await agents_orchestrator.run_daily_automation(shop_id)
        return result
        
    except Exception as e:
        logger.error(f"Error running daily automation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/agents/weekly-analysis")
async def run_weekly_analysis(shop_id: str):
    """Run weekly AI analysis for a shop"""
    try:
        result = await agents_orchestrator.run_weekly_analysis(shop_id)
        return result
        
    except Exception as e:
        logger.error(f"Error running weekly analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/agents/inventory-health/{shop_id}")
async def get_inventory_health(shop_id: str):
    """Get AI-powered inventory health analysis"""
    try:
        result = await agents_orchestrator.inventory_agent.analyze_inventory_health(shop_id)
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing inventory health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/agents/customer-segments/{shop_id}")
async def get_customer_segments(shop_id: str):
    """Get AI-powered customer segmentation"""
    try:
        result = await agents_orchestrator.customer_agent.analyze_customer_segments(shop_id)
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing customer segments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/agents/churn-prediction/{shop_id}")
async def get_churn_prediction(shop_id: str):
    """Get AI-powered customer churn prediction"""
    try:
        result = await agents_orchestrator.customer_agent.predict_customer_churn(shop_id)
        return result
        
    except Exception as e:
        logger.error(f"Error predicting customer churn: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Utility endpoints
@app.post("/v1/index-documents")
async def index_documents(documents: List[Dict[str, Any]]):
    """Index documents for RAG"""
    try:
        result = await rag_service.index_documents(documents)
        return {"indexed": len(documents), "result": result}
        
    except Exception as e:
        logger.error(f"Error indexing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/models")
async def list_models():
    """List available AI models"""
    try:
        models = await ai_models.list_models()
        return {"models": models}
        
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task functions
async def log_ai_request(request: GenerateRequest, response: Dict[str, Any], user_id: Optional[str]):
    """Log AI request for audit purposes"""
    try:
        await db_manager.log_ai_request(
            user_id=user_id,
            model=request.model,
            prompt=request.prompt,
            response=response["text"],
            tokens_used=response["tokens_used"],
            context_documents=request.context_documents
        )
    except Exception as e:
        logger.error(f"Error logging AI request: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
