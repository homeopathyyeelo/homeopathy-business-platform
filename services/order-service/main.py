#!/usr/bin/env python3
"""
Order Service Microservice - Order processing, cart management, and checkout
Built with FastAPI for high-performance order management in the e-commerce platform
"""

import os
import sys
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
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON, DECIMAL, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import redis
import aio_pika
import json
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/var/log/order_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/order_service_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class ShippingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RETURNED = "returned"

# Database Models
class Cart(Base):
    __tablename__ = "carts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, index=True, nullable=False)
    session_id = Column(String, index=True, nullable=True)  # For guest carts
    items = Column(JSON, nullable=False)  # Array of cart items
    subtotal = Column(DECIMAL(10, 2), default=0)
    tax_amount = Column(DECIMAL(10, 2), default=0)
    discount_amount = Column(DECIMAL(10, 2), default=0)
    shipping_amount = Column(DECIMAL(10, 2), default=0)
    total_amount = Column(DECIMAL(10, 2), default=0)
    coupon_code = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    cart_id = Column(String, index=True, nullable=True)
    status = Column(String(20), default=OrderStatus.PENDING)
    payment_status = Column(String(20), default=PaymentStatus.PENDING)
    shipping_status = Column(String(20), default=ShippingStatus.PENDING)

    # Customer information
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(20), nullable=True)
    billing_address = Column(JSON, nullable=False)
    shipping_address = Column(JSON, nullable=False)

    # Order items
    items = Column(JSON, nullable=False)  # Array of order items

    # Pricing
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    tax_amount = Column(DECIMAL(10, 2), default=0)
    discount_amount = Column(DECIMAL(10, 2), default=0)
    shipping_amount = Column(DECIMAL(10, 2), default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False)

    # Payment information
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    currency = Column(String(3), default="USD")

    # Shipping information
    shipping_method = Column(String(100), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)

    # Notes and metadata
    notes = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, index=True, nullable=False)
    product_id = Column(Integer, index=True, nullable=False)
    sku = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    discount = Column(DECIMAL(10, 2), default=0)
    total = Column(DECIMAL(10, 2), nullable=False)
    attributes = Column(JSON, nullable=True)  # Product attributes/variants

# Pydantic Models
class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    attributes: Optional[Dict[str, Any]] = None  # For product variants

class CartCreate(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    items: List[CartItemCreate]

class CartUpdate(BaseModel):
    items: List[CartItemCreate]

class CartResponse(BaseModel):
    id: str
    user_id: Optional[int]
    session_id: Optional[str]
    items: List[Dict[str, Any]]
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    total_amount: Decimal
    coupon_code: Optional[str]
    is_active: bool
    expires_at: datetime
    created_at: datetime
    updated_at: datetime

class Address(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str = "US"

class OrderCreate(BaseModel):
    cart_id: str
    shipping_address: Address
    billing_address: Address
    shipping_method: str
    payment_method: str
    notes: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    order_id: str
    product_id: int
    sku: str
    name: str
    quantity: int
    price: Decimal
    discount: Decimal
    total: Decimal
    attributes: Optional[Dict[str, Any]]

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: int
    cart_id: Optional[str]
    status: str
    payment_status: str
    shipping_status: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str]
    billing_address: Dict[str, str]
    shipping_address: Dict[str, str]
    items: List[OrderItemResponse]
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    total_amount: Decimal
    payment_method: Optional[str]
    payment_reference: Optional[str]
    currency: str
    shipping_method: Optional[str]
    tracking_number: Optional[str]
    estimated_delivery: Optional[datetime]
    notes: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_status: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def publish_order_event(event_type: str, order_data: dict):
    """Publish order events to message queue"""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            await channel.default_exchange.publish(
                aio_pika.Message(body=json.dumps({
                    "event_type": event_type,
                    "order_data": order_data,
                    "timestamp": datetime.utcnow().isoformat()
                }).encode()),
                routing_key="order.events"
            )
        logger.info(f"Published order event: {event_type}")
    except Exception as e:
        logger.error(f"Failed to publish order event: {str(e)}")

def generate_order_number() -> str:
    """Generate unique order number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    random_suffix = str(uuid.uuid4())[:6].upper()
    return f"ORD{timestamp}{random_suffix}"

# API Routes
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Order Service...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    yield
    # Shutdown
    logger.info("Shutting down Order Service...")

app = FastAPI(
    title="Order Service",
    description="Microservice for order processing, cart management, and checkout",
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
    return {"status": "healthy", "service": "order-service", "timestamp": datetime.utcnow()}

# Cart routes
@app.post("/carts", response_model=CartResponse)
async def create_cart(cart_data: CartCreate, db: Session = Depends(get_db)):
    # Set expiration (24 hours from now)
    expires_at = datetime.utcnow() + timedelta(hours=24)

    cart = Cart(
        user_id=cart_data.user_id,
        session_id=cart_data.session_id,
        items=[item.dict() for item in cart_data.items],
        subtotal=Decimal('0'),
        tax_amount=Decimal('0'),
        discount_amount=Decimal('0'),
        shipping_amount=Decimal('0'),
        total_amount=Decimal('0'),
        is_active=True,
        expires_at=expires_at
    )

    # Calculate totals
    subtotal = Decimal('0')
    for item in cart_data.items:
        subtotal += Decimal(str(item.quantity)) * Decimal('0')  # Price would come from product service

    cart.subtotal = subtotal
    cart.total_amount = subtotal  # Add tax and shipping calculations

    db.add(cart)
    db.commit()
    db.refresh(cart)

    logger.info(f"Cart created: {cart.id}")
    return CartResponse.from_orm(cart)

@app.get("/carts/{cart_id}", response_model=CartResponse)
async def get_cart(cart_id: str, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart or not cart.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )
    return CartResponse.from_orm(cart)

@app.put("/carts/{cart_id}", response_model=CartResponse)
async def update_cart(cart_id: str, cart_data: CartUpdate, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart or not cart.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    # Update cart items
    cart.items = [item.dict() for item in cart_data.items]

    # Recalculate totals
    subtotal = Decimal('0')
    for item in cart_data.items:
        subtotal += Decimal(str(item.quantity)) * Decimal('0')  # Price would come from product service

    cart.subtotal = subtotal
    cart.total_amount = subtotal  # Add tax and shipping calculations
    cart.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(cart)

    logger.info(f"Cart updated: {cart.id}")
    return CartResponse.from_orm(cart)

@app.post("/carts/{cart_id}/add-item")
async def add_item_to_cart(cart_id: str, item: CartItemCreate, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart or not cart.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    # Check if item already exists in cart
    existing_items = cart.items if cart.items else []
    item_exists = False

    for existing_item in existing_items:
        if (existing_item.get('product_id') == item.product_id and
            existing_item.get('attributes') == item.attributes):
            existing_item['quantity'] += item.quantity
            item_exists = True
            break

    if not item_exists:
        existing_items.append(item.dict())

    cart.items = existing_items

    # Recalculate totals
    subtotal = Decimal('0')
    for cart_item in existing_items:
        subtotal += Decimal(str(cart_item['quantity'])) * Decimal('0')  # Price would come from product service

    cart.subtotal = subtotal
    cart.total_amount = subtotal
    cart.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(cart)

    logger.info(f"Item added to cart: {cart.id}")
    return CartResponse.from_orm(cart)

@app.delete("/carts/{cart_id}/items/{product_id}")
async def remove_item_from_cart(cart_id: str, product_id: int, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart or not cart.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    existing_items = cart.items if cart.items else []
    new_items = []

    for item in existing_items:
        if item.get('product_id') != product_id:
            new_items.append(item)

    cart.items = new_items

    # Recalculate totals
    subtotal = Decimal('0')
    for item in new_items:
        subtotal += Decimal(str(item['quantity'])) * Decimal('0')  # Price would come from product service

    cart.subtotal = subtotal
    cart.total_amount = subtotal
    cart.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(cart)

    logger.info(f"Item removed from cart: {cart.id}")
    return CartResponse.from_orm(cart)

@app.delete("/carts/{cart_id}")
async def delete_cart(cart_id: str, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    cart.is_active = False
    db.commit()

    logger.info(f"Cart deleted: {cart.id}")
    return {"message": "Cart deleted successfully"}

# Order routes
@app.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Get cart
    cart = db.query(Cart).filter(Cart.id == order_data.cart_id).first()
    if not cart or not cart.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    # Generate order number
    order_number = generate_order_number()

    # Create order
    order = Order(
        order_number=order_number,
        user_id=cart.user_id,
        cart_id=order_data.cart_id,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        shipping_status=ShippingStatus.PENDING,
        customer_name="Customer Name",  # Would come from user service
        customer_email="customer@example.com",  # Would come from user service
        customer_phone="1234567890",  # Would come from user service
        billing_address=order_data.billing_address.dict(),
        shipping_address=order_data.shipping_address.dict(),
        items=cart.items,
        subtotal=cart.subtotal,
        tax_amount=cart.tax_amount,
        discount_amount=cart.discount_amount,
        shipping_amount=cart.shipping_amount,
        total_amount=cart.total_amount,
        payment_method=order_data.payment_method,
        shipping_method=order_data.shipping_method,
        notes=order_data.notes
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    # Deactivate cart
    cart.is_active = False
    db.commit()

    # Publish order created event
    asyncio.create_task(publish_order_event("order_created", {
        "order_id": order.id,
        "order_number": order.order_number,
        "user_id": order.user_id,
        "total_amount": float(order.total_amount),
        "status": order.status
    }))

    logger.info(f"Order created: {order.order_number}")
    return OrderResponse.from_orm(order)

@app.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    return OrderResponse.from_orm(order)

@app.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    shipping_status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if user_id:
        query = query.filter(Order.user_id == user_id)
    if status:
        query = query.filter(Order.status == status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    if shipping_status:
        query = query.filter(Order.shipping_status == shipping_status)

    offset = (page - 1) * per_page
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(per_page).all()

    return [OrderResponse.from_orm(order) for order in orders]

@app.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_data: OrderUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Update fields
    for field, value in order_data.dict(exclude_unset=True).items():
        if hasattr(order, field):
            setattr(order, field, value)

    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)

    # Publish order updated event
    asyncio.create_task(publish_order_event("order_updated", {
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "payment_status": order.payment_status
    }))

    logger.info(f"Order updated: {order.order_number}")
    return OrderResponse.from_orm(order)

@app.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order cannot be cancelled"
        )

    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    db.commit()

    # Publish order cancelled event
    asyncio.create_task(publish_order_event("order_cancelled", {
        "order_id": order.id,
        "order_number": order.order_number,
        "reason": "user_cancelled"
    }))

    logger.info(f"Order cancelled: {order.order_number}")
    return {"message": "Order cancelled successfully"}

# Order status management
@app.post("/orders/{order_id}/confirm")
async def confirm_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in pending status"
        )

    order.status = OrderStatus.CONFIRMED
    order.updated_at = datetime.utcnow()
    db.commit()

    # Publish order confirmed event
    asyncio.create_task(publish_order_event("order_confirmed", {
        "order_id": order.id,
        "order_number": order.order_number,
        "total_amount": float(order.total_amount)
    }))

    logger.info(f"Order confirmed: {order.order_number}")
    return {"message": "Order confirmed successfully"}

@app.post("/orders/{order_id}/ship")
async def ship_order(
    order_id: str,
    tracking_number: str,
    estimated_delivery: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status != OrderStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in confirmed status"
        )

    order.status = OrderStatus.SHIPPED
    order.shipping_status = ShippingStatus.SHIPPED
    order.tracking_number = tracking_number
    order.estimated_delivery = estimated_delivery
    order.shipped_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()
    db.commit()

    # Publish order shipped event
    asyncio.create_task(publish_order_event("order_shipped", {
        "order_id": order.id,
        "order_number": order.order_number,
        "tracking_number": tracking_number,
        "estimated_delivery": estimated_delivery.isoformat() if estimated_delivery else None
    }))

    logger.info(f"Order shipped: {order.order_number}")
    return {"message": "Order shipped successfully"}

@app.post("/orders/{order_id}/deliver")
async def deliver_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if order.status != OrderStatus.SHIPPED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not in shipped status"
        )

    order.status = OrderStatus.DELIVERED
    order.shipping_status = ShippingStatus.DELIVERED
    order.delivered_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()
    db.commit()

    # Publish order delivered event
    asyncio.create_task(publish_order_event("order_delivered", {
        "order_id": order.id,
        "order_number": order.order_number,
        "delivered_at": order.delivered_at.isoformat()
    }))

    logger.info(f"Order delivered: {order.order_number}")
    return {"message": "Order delivered successfully"}

# Analytics routes
@app.get("/analytics/orders")
async def get_order_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)

    # Default to last 30 days if no dates provided
    if not start_date and not end_date:
        start_date = datetime.utcnow() - timedelta(days=30)
        query = query.filter(Order.created_at >= start_date)

    orders = query.all()

    # Calculate analytics
    total_orders = len(orders)
    total_revenue = sum(float(order.total_amount) for order in orders)
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0

    # Status breakdown
    status_counts = {}
    for order in orders:
        status_counts[order.status] = status_counts.get(order.status, 0) + 1

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "average_order_value": average_order_value,
        "status_breakdown": status_counts,
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
        port=8003,
        reload=True,
        log_level="info",
        access_log=True
    )
