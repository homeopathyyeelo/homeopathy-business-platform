#!/usr/bin/env python3
"""
Payment Service Microservice - Payment processing, billing, and refunds
Built with FastAPI for high-performance payment management in the e-commerce platform
Enhanced Payment Service with Dynamic Features
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from decimal import Decimal
from enum import Enum

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field, validator
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import redis
import aio_pika
import json
import uuid
import stripe
import razorpay
import paypalrestsdk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/var/log/payment_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5433/yeelo_homeopathy")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

# Payment gateway configurations
STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY", "pk_test_mock")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret")

# Initialize payment gateways
stripe.api_key = STRIPE_SECRET_KEY
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Enums
class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    NET_BANKING = "net_banking"
    UPI = "upi"
    WALLET = "wallet"
    BANK_TRANSFER = "bank_transfer"

class PaymentGateway(str, Enum):
    STRIPE = "stripe"
    RAZORPAY = "razorpay"
    PAYPAL = "paypal"

# Database Models
class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default=PaymentStatus.PENDING)
    payment_method = Column(String(50), nullable=False)
    gateway = Column(String(50), nullable=False)
    gateway_reference = Column(String(255), nullable=True)  # Gateway payment ID
    gateway_response = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_id = Column(String, index=True, nullable=False)
    order_id = Column(String, index=True, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default=PaymentStatus.PENDING)
    gateway = Column(String(50), nullable=False)
    gateway_reference = Column(String(255), nullable=True)
    reason = Column(String(255), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class PaymentWebhook(Base):
    __tablename__ = "payment_webhooks"

    id = Column(Integer, primary_key=True, index=True)
    gateway = Column(String(50), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic Models
class PaymentCreate(BaseModel):
    order_id: str
    user_id: int
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    payment_method: str
    gateway: str = Field(..., regex="^(stripe|razorpay|paypal)$")
    metadata: Optional[Dict[str, Any]] = None

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    user_id: int
    amount: Decimal
    currency: str
    status: str
    payment_method: str
    gateway: str
    gateway_reference: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

class RefundCreate(BaseModel):
    payment_id: str
    amount: Decimal = Field(..., gt=0)
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class RefundResponse(BaseModel):
    id: str
    payment_id: str
    order_id: str
    amount: Decimal
    currency: str
    status: str
    gateway: str
    gateway_reference: Optional[str]
    reason: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime]

class StripePaymentIntent(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    payment_method_types: List[str] = ["card"]
    metadata: Optional[Dict[str, Any]] = None

class RazorpayOrderCreate(BaseModel):
    amount: int  # Amount in paise
    currency: str = "INR"
    receipt: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def publish_payment_event(event_type: str, payment_data: dict):
    """Publish payment events to message queue"""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            await channel.default_exchange.publish(
                aio_pika.Message(body=json.dumps({
                    "event_type": event_type,
                    "payment_data": payment_data,
                    "timestamp": datetime.utcnow().isoformat()
                }).encode()),
                routing_key="payment.events"
            )
        logger.info(f"Published payment event: {event_type}")
    except Exception as e:
        logger.error(f"Failed to publish payment event: {str(e)}")

# API Routes
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Payment Service...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    yield
    # Shutdown
    logger.info("Shutting down Payment Service...")

app = FastAPI(
    title="Payment Service",
    description="Microservice for payment processing, billing, and refunds",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "payment-service", "timestamp": datetime.utcnow()}

# Payment routes
@app.post("/payments", response_model=PaymentResponse)
async def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
    payment = Payment(
        order_id=payment_data.order_id,
        user_id=payment_data.user_id,
        amount=payment_data.amount,
        currency=payment_data.currency,
        payment_method=payment_data.payment_method,
        gateway=payment_data.gateway,
        status=PaymentStatus.PENDING,
        metadata=payment_data.metadata
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    logger.info(f"Payment created: {payment.id} for order {payment.order_id}")
    return PaymentResponse.from_orm(payment)

@app.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return PaymentResponse.from_orm(payment)

@app.get("/orders/{order_id}/payments", response_model=List[PaymentResponse])
async def get_order_payments(order_id: str, db: Session = Depends(get_db)):
    payments = db.query(Payment).filter(Payment.order_id == order_id).all()
    return [PaymentResponse.from_orm(payment) for payment in payments]

# Stripe integration
@app.post("/stripe/payment-intent")
async def create_stripe_payment_intent(intent_data: StripePaymentIntent):
    try:
        intent = stripe.PaymentIntent.create(
            amount=intent_data.amount),
            currency=intent_data.currency,
            payment_method_types=intent_data.payment_method_types,
            metadata=intent_data.metadata or {}
        )

        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": intent.amount,
            "currency": intent.currency,
            "status": intent.status
        }
    except Exception as e:
        logger.error(f"Stripe payment intent creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment intent"
        )

@app.post("/stripe/webhook")
async def stripe_webhook(payload: Dict[str, Any]):
    # Verify webhook signature (in production)
    event = payload

    # Process webhook event
    event_type = event.get("type")
    event_data = event.get("data", {}).get("object", {})

    if event_type == "payment_intent.succeeded":
        payment_intent_id = event_data.get("id")
        # Update payment status in database
        logger.info(f"Payment succeeded: {payment_intent_id}")

    elif event_type == "payment_intent.payment_failed":
        payment_intent_id = event_data.get("id")
        # Update payment status to failed
        logger.info(f"Payment failed: {payment_intent_id}")

    return {"status": "processed"}

# Razorpay integration
@app.post("/razorpay/order")
async def create_razorpay_order(order_data: RazorpayOrderCreate):
    try:
        order = razorpay_client.order.create({
            "amount": order_data.amount,
            "currency": order_data.currency,
            "receipt": order_data.receipt,
            "notes": order_data.notes or {}
        })

        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "status": order["status"]
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )

@app.post("/razorpay/verify")
async def verify_razorpay_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
):
    try:
        # Verify payment signature
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })

        # Payment verified successfully
        return {
            "status": "verified",
            "payment_id": razorpay_payment_id,
            "order_id": razorpay_order_id
        }
    except Exception as e:
        logger.error(f"Razorpay payment verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed"
        )

# Refund routes
@app.post("/refunds", response_model=RefundResponse)
async def create_refund(refund_data: RefundCreate, db: Session = Depends(get_db)):
    # Get payment information
    payment = db.query(Payment).filter(Payment.id == refund_data.payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot refund incomplete payment"
        )

    refund = Refund(
        payment_id=refund_data.payment_id,
        order_id=payment.order_id,
        amount=refund_data.amount,
        currency=payment.currency,
        gateway=payment.gateway,
        status=PaymentStatus.PENDING,
        reason=refund_data.reason,
        metadata=refund_data.metadata
    )

    db.add(refund)
    db.commit()
    db.refresh(refund)

    # Process refund based on gateway
    if payment.gateway == PaymentGateway.STRIPE:
        try:
            stripe_refund = stripe.Refund.create(
                payment_intent=payment.gateway_reference,
                amount=int(float(refund_data.amount) * 100)  # Convert to cents
            )
            refund.gateway_reference = stripe_refund.id
            refund.status = PaymentStatus.COMPLETED
            refund.completed_at = datetime.utcnow()
        except Exception as e:
            logger.error(f"Stripe refund failed: {str(e)}")
            refund.status = PaymentStatus.FAILED

    elif payment.gateway == PaymentGateway.RAZORPAY:
        try:
            razorpay_refund = razorpay_client.payment.refund(
                payment.gateway_reference,
                {
                    "amount": int(float(refund_data.amount) * 100),  # Convert to paise
                    "notes": {"reason": refund_data.reason or "Customer refund"}
                }
            )
            refund.gateway_reference = razorpay_refund["id"]
            refund.status = PaymentStatus.COMPLETED
            refund.completed_at = datetime.utcnow()
        except Exception as e:
            logger.error(f"Razorpay refund failed: {str(e)}")
            refund.status = PaymentStatus.FAILED

    db.commit()

    # Publish refund event
    asyncio.create_task(publish_payment_event("refund_created", {
        "refund_id": refund.id,
        "payment_id": refund.payment_id,
        "order_id": refund.order_id,
        "amount": float(refund.amount),
        "status": refund.status
    }))

    logger.info(f"Refund created: {refund.id}")
    return RefundResponse.from_orm(refund)

@app.get("/refunds/{refund_id}", response_model=RefundResponse)
async def get_refund(refund_id: str, db: Session = Depends(get_db)):
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found"
        )
    return RefundResponse.from_orm(refund)

@app.get("/orders/{order_id}/refunds", response_model=List[RefundResponse])
async def get_order_refunds(order_id: str, db: Session = Depends(get_db)):
    refunds = db.query(Refund).filter(Refund.order_id == order_id).all()
    return [RefundResponse.from_orm(refund) for refund in refunds]

# Analytics routes
@app.get("/analytics/payments")
async def get_payment_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    gateway: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Payment)

    if start_date:
        query = query.filter(Payment.created_at >= start_date)
    if end_date:
        query = query.filter(Payment.created_at <= end_date)
    if gateway:
        query = query.filter(Payment.gateway == gateway)
    if status:
        query = query.filter(Payment.status == status)

    # Default to last 30 days if no dates provided
    if not start_date and not end_date:
        start_date = datetime.utcnow() - timedelta(days=30)
        query = query.filter(Payment.created_at >= start_date)

    payments = query.all()

    # Calculate analytics
    total_payments = len(payments)
    total_amount = sum(float(payment.amount) for payment in payments)
    completed_payments = len([p for p in payments if p.status == PaymentStatus.COMPLETED])
    failed_payments = len([p for p in payments if p.status == PaymentStatus.FAILED])

    # Gateway breakdown
    gateway_stats = {}
    for payment in payments:
        gateway_stats[payment.gateway] = gateway_stats.get(payment.gateway, {
            "count": 0,
            "amount": 0,
            "completed": 0,
            "failed": 0
        })
        gateway_stats[payment.gateway]["count"] += 1
        gateway_stats[payment.gateway]["amount"] += float(payment.amount)
        if payment.status == PaymentStatus.COMPLETED:
            gateway_stats[payment.gateway]["completed"] += 1
        elif payment.status == PaymentStatus.FAILED:
            gateway_stats[payment.gateway]["failed"] += 1

    return {
        "total_payments": total_payments,
        "total_amount": total_amount,
        "completed_payments": completed_payments,
        "failed_payments": failed_payments,
        "success_rate": (completed_payments / total_payments * 100) if total_payments > 0 else 0,
        "gateway_breakdown": gateway_stats,
        "date_range": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None
        }
    }

# Middleware for request logging
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info",
        access_log=True
    )
