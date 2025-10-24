"""
Invoice Parser Service - Main Application
FastAPI service for parsing vendor invoices and matching products
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app
import time
import uuid

from app.core.config import settings
from app.api.routes import upload, parse, match, reconcile

# Create FastAPI app
app = FastAPI(
    title="Invoice Parser Service",
    description="Parse vendor invoices, match products, and update inventory",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Include routers
app.include_router(upload.router, prefix="/api/v1/invoices", tags=["Upload"])
app.include_router(parse.router, prefix="/api/v1/invoices", tags=["Parse"])
app.include_router(match.router, prefix="/api/v1/invoices", tags=["Match"])
app.include_router(reconcile.router, prefix="/api/v1/invoices", tags=["Reconcile"])

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "invoice-parser-service",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Invoice Parser Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "request_id": getattr(request.state, "request_id", None)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8005,
        reload=True,
        log_level="info"
    )
