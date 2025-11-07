#!/usr/bin/env python3
"""
Product Service Microservice - Product catalog, inventory, and categories
Built with FastAPI for high-performance product management in the e-commerce platform
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from contextlib import asynccontextmanager
from decimal import Decimal

from sqlalchemy import or_
from fastapi import FastAPI, HTTPException, Depends, status, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field, validator
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON, Float, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import redis
import aio_pika
import json
import elasticsearch
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/var/log/product_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5433/yeelo_homeopathy")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Elasticsearch setup
es = Elasticsearch([ELASTICSEARCH_URL])

# Database Models
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    parent_id = Column(Integer, index=True, nullable=True)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text)
    short_description = Column(Text)
    category_id = Column(Integer, index=True, nullable=False)
    brand = Column(String(100))
    price = Column(DECIMAL(10, 2), nullable=False)
    sale_price = Column(DECIMAL(10, 2), nullable=True)
    cost_price = Column(DECIMAL(10, 2), nullable=True)
    stock_quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=0)
    max_stock_level = Column(Integer, default=1000)
    weight = Column(Float, nullable=True)
    dimensions = Column(JSON, nullable=True)  # length, width, height
    images = Column(JSON, nullable=True)  # Array of image URLs
    attributes = Column(JSON, nullable=True)  # Product attributes
    variants = Column(JSON, nullable=True)  # Product variants
    tags = Column(JSON, nullable=True)  # Array of tags
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_digital = Column(Boolean, default=False)
    requires_shipping = Column(Boolean, default=True)
    seo_title = Column(String(255))
    seo_description = Column(Text)
    seo_keywords = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("Category", back_populates="products")
    inventory_logs = relationship("InventoryLog", back_populates="product")
    reviews = relationship("ProductReview", back_populates="product")

class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True, nullable=False)
    operation_type = Column(String(20), nullable=False)  # in, out, adjustment
    quantity_change = Column(Integer, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reason = Column(String(255))
    reference_id = Column(String(100))  # Order ID, Purchase ID, etc.
    reference_type = Column(String(50))  # order, purchase, manual
    user_id = Column(Integer, index=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inventory_logs")

class ProductReview(Base):
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    order_id = Column(Integer, index=True, nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255))
    comment = Column(Text)
    pros = Column(JSON, nullable=True)  # Array of pros
    cons = Column(JSON, nullable=True)  # Array of cons
    is_verified = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="reviews")

# Pydantic Models
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = None
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    parent_id: Optional[int]
    image_url: Optional[str]
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime
    subcategories: List['CategoryResponse'] = []
    product_count: int = 0

class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: int
    brand: Optional[str] = Field(None, max_length=100)
    price: Decimal = Field(..., gt=0)
    sale_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    stock_quantity: int = 0
    min_stock_level: int = 0
    max_stock_level: int = 1000
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None
    images: Optional[List[str]] = None
    attributes: Optional[Dict[str, Any]] = None
    variants: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_featured: bool = False
    is_digital: bool = False
    requires_shipping: bool = True
    seo_title: Optional[str] = Field(None, max_length=255)
    seo_description: Optional[str] = None
    seo_keywords: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0)
    sale_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    max_stock_level: Optional[int] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None
    images: Optional[List[str]] = None
    attributes: Optional[Dict[str, Any]] = None
    variants: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    is_digital: Optional[bool] = None
    requires_shipping: Optional[bool] = None
    seo_title: Optional[str] = Field(None, max_length=255)
    seo_description: Optional[str] = None
    seo_keywords: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    slug: str
    description: Optional[str]
    short_description: Optional[str]
    category_id: int
    category: Optional[CategoryResponse]
    brand: Optional[str]
    price: Decimal
    sale_price: Optional[Decimal]
    cost_price: Optional[Decimal]
    stock_quantity: int
    min_stock_level: int
    max_stock_level: int
    weight: Optional[float]
    dimensions: Optional[Dict[str, float]]
    images: Optional[List[str]]
    attributes: Optional[Dict[str, Any]]
    variants: Optional[Dict[str, Any]]
    tags: Optional[List[str]]
    is_featured: bool
    is_active: bool
    is_digital: bool
    requires_shipping: bool
    seo_title: Optional[str]
    seo_description: Optional[str]
    seo_keywords: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    average_rating: float = 0.0
    review_count: int = 0

class InventoryLogCreate(BaseModel):
    product_id: int
    operation_type: str = Field(..., regex="^(in|out|adjustment)$")
    quantity_change: int
    reason: Optional[str] = Field(None, max_length=255)
    reference_id: Optional[str] = Field(None, max_length=100)
    reference_type: Optional[str] = Field(None, max_length=50)
    user_id: Optional[int] = None
    notes: Optional[str] = None

class InventoryLogResponse(BaseModel):
    id: int
    product_id: int
    operation_type: str
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reason: Optional[str]
    reference_id: Optional[str]
    reference_type: Optional[str]
    user_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

class ProductSearchParams(BaseModel):
    query: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    in_stock: Optional[bool] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    sort_by: str = "created_at"  # created_at, price, name, popularity
    sort_order: str = "desc"  # asc, desc
    page: int = 1
    per_page: int = 20

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def publish_product_event(event_type: str, product_data: dict):
    """Publish product events to message queue"""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            await channel.default_exchange.publish(
                aio_pika.Message(body=json.dumps({
                    "event_type": event_type,
                    "product_data": product_data,
                    "timestamp": datetime.utcnow().isoformat()
                }).encode()),
                routing_key="product.events"
            )
        logger.info(f"Published product event: {event_type}")
    except Exception as e:
        logger.error(f"Failed to publish product event: {str(e)}")

def index_product_elasticsearch(product: Product):
    """Index product in Elasticsearch for search"""
    try:
        doc = {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "short_description": product.short_description,
            "category_id": product.category_id,
            "brand": product.brand,
            "price": float(product.price),
            "sale_price": float(product.sale_price) if product.sale_price else None,
            "stock_quantity": product.stock_quantity,
            "is_featured": product.is_featured,
            "is_active": product.is_active,
            "tags": product.tags,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        }

        es.index(index="products", id=product.id, document=doc)
        logger.info(f"Indexed product {product.id} in Elasticsearch")
    except Exception as e:
        logger.error(f"Failed to index product {product.id}: {str(e)}")

def delete_product_elasticsearch(product_id: int):
    """Delete product from Elasticsearch"""
    try:
        es.delete(index="products", id=product_id)
        logger.info(f"Deleted product {product_id} from Elasticsearch")
    except Exception as e:
        logger.error(f"Failed to delete product {product_id} from Elasticsearch: {str(e)}")

# API Routes
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Product Service...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    # Initialize Elasticsearch index
    try:
        if not es.indices.exists(index="products"):
            es.indices.create(index="products", body={
                "mappings": {
                    "properties": {
                        "name": {"type": "text", "analyzer": "standard"},
                        "description": {"type": "text", "analyzer": "standard"},
                        "brand": {"type": "keyword"},
                        "category_id": {"type": "integer"},
                        "price": {"type": "float"},
                        "tags": {"type": "keyword"},
                        "is_active": {"type": "boolean"},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"}
                    }
                }
            })
            logger.info("Created Elasticsearch products index")
    except Exception as e:
        logger.error(f"Failed to create Elasticsearch index: {str(e)}")

    yield
    # Shutdown
    logger.info("Shutting down Product Service...")

app = FastAPI(
    title="Product Service",
    description="Microservice for product catalog, inventory, and categories",
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
    return {"status": "healthy", "service": "product-service", "timestamp": datetime.utcnow()}

# Category routes
@app.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    parent_id: Optional[int] = Query(None, description="Filter by parent category"),
    include_inactive: bool = Query(False, description="Include inactive categories"),
    db: Session = Depends(get_db)
):
    query = db.query(Category)
    if not include_inactive:
        query = query.filter(Category.is_active == True)

    if parent_id is not None:
        query = query.filter(Category.parent_id == parent_id)
    else:
        query = query.filter(Category.parent_id.is_(None))  # Root categories

    categories = query.order_by(Category.sort_order, Category.name).all()

    # Build category tree
    result = []
    for category in categories:
        category_dict = CategoryResponse.from_orm(category).dict()

        # Get product count
        product_count = db.query(Product).filter(
            Product.category_id == category.id,
            Product.is_active == True
        ).count()
        category_dict["product_count"] = product_count

        # Get subcategories
        subcategories = db.query(Category).filter(
            Category.parent_id == category.id,
            Category.is_active == True
        ).order_by(Category.sort_order, Category.name).all()

        category_dict["subcategories"] = [
            CategoryResponse.from_orm(sub).dict() for sub in subcategories
        ]

        result.append(category_dict)

    return result

@app.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    category_dict = CategoryResponse.from_orm(category).dict()

    # Get product count
    product_count = db.query(Product).filter(
        Product.category_id == category.id,
        Product.is_active == True
    ).count()
    category_dict["product_count"] = product_count

    return category_dict

@app.post("/categories", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate, db: Session = Depends(get_db)):
    # Check if slug already exists
    existing = db.query(Category).filter(Category.slug == category_data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category slug already exists"
        )

    # Check if parent exists
    if category_data.parent_id:
        parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found"
            )

    category = Category(**category_data.dict())
    db.add(category)
    db.commit()
    db.refresh(category)

    logger.info(f"Category created: {category.name}")
    return CategoryResponse.from_orm(category)

@app.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check if slug already exists (if updating slug)
    if category_data.slug and category_data.slug != category.slug:
        existing = db.query(Category).filter(Category.slug == category_data.slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category slug already exists"
            )

    # Update fields
    for field, value in category_data.dict(exclude_unset=True).items():
        setattr(category, field, value)

    category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(category)

    logger.info(f"Category updated: {category.name}")
    return CategoryResponse.from_orm(category)

@app.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check if category has products
    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    if product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with existing products"
        )

    db.delete(category)
    db.commit()

    logger.info(f"Category deleted: {category.name}")
    return {"message": "Category deleted successfully"}

# Product routes
@app.get("/products", response_model=List[ProductResponse])
async def get_products(
    search_params: ProductSearchParams = Depends(),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)

    # Apply filters
    if search_params.query:
        search_term = f"%{search_params.query}%"
        query = query.filter(
            (Product.name.ilike(search_term)) |
            (Product.description.ilike(search_term)) |
            (Product.sku.ilike(search_term))
        )

    if search_params.category_id:
        query = query.filter(Product.category_id == search_params.category_id)

    if search_params.brand:
        query = query.filter(Product.brand == search_params.brand)

    if search_params.min_price is not None:
        query = query.filter(Product.price >= search_params.min_price)

    if search_params.max_price is not None:
        query = query.filter(Product.price <= search_params.max_price)

    if search_params.in_stock is not None:
        if search_params.in_stock:
            query = query.filter(Product.stock_quantity > 0)
        else:
            query = query.filter(Product.stock_quantity == 0)

    if search_params.is_featured is not None:
        query = query.filter(Product.is_featured == search_params.is_featured)

    if search_params.tags:
        # Filter products that have any of the specified tags
        tag_conditions = []
        for tag in search_params.tags:
            tag_conditions.append(Product.tags.contains([tag]))
        query = query.filter(or_(*tag_conditions))

    # Apply sorting
    sort_column = getattr(Product, search_params.sort_by)
    if search_params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    offset = (search_params.page - 1) * search_params.per_page
    products = query.offset(offset).limit(search_params.per_page).all()

    # Get categories for products
    category_ids = [p.category_id for p in products]
    categories = {}
    if category_ids:
        category_objs = db.query(Category).filter(Category.id.in_(category_ids)).all()
        categories = {cat.id: CategoryResponse.from_orm(cat) for cat in category_objs}

    # Build response
    result = []
    for product in products:
        product_dict = ProductResponse.from_orm(product).dict()
        product_dict["category"] = categories.get(product.category_id)

        # Calculate average rating and review count
        reviews = db.query(ProductReview).filter(
            ProductReview.product_id == product.id,
            ProductReview.is_verified == True
        ).all()

        if reviews:
            product_dict["average_rating"] = sum(r.rating for r in reviews) / len(reviews)
            product_dict["review_count"] = len(reviews)

        result.append(product_dict)

    return result

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product_dict = ProductResponse.from_orm(product).dict()

    # Get category
    category = db.query(Category).filter(Category.id == product.category_id).first()
    if category:
        product_dict["category"] = CategoryResponse.from_orm(category)

    # Calculate average rating and review count
    reviews = db.query(ProductReview).filter(
        ProductReview.product_id == product.id,
        ProductReview.is_verified == True
    ).all()

    if reviews:
        product_dict["average_rating"] = sum(r.rating for r in reviews) / len(reviews)
        product_dict["review_count"] = len(reviews)

    return product_dict

@app.post("/products", response_model=ProductResponse)
async def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    # Check if SKU already exists
    existing = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product SKU already exists"
        )

    # Check if category exists
    category = db.query(Category).filter(Category.id == product_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found"
        )

    product = Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)

    # Index in Elasticsearch
    index_product_elasticsearch(product)

    # Publish product created event
    asyncio.create_task(publish_product_event("product_created", {
        "product_id": product.id,
        "sku": product.sku,
        "name": product.name,
        "category_id": product.category_id
    }))

    logger.info(f"Product created: {product.name} (SKU: {product.sku})")
    return ProductResponse.from_orm(product)

@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Check if SKU already exists (if updating SKU)
    if product_data.sku and product_data.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == product_data.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product SKU already exists"
            )

    # Update fields
    for field, value in product_data.dict(exclude_unset=True).items():
        setattr(product, field, value)

    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)

    # Update Elasticsearch
    index_product_elasticsearch(product)

    logger.info(f"Product updated: {product.name} (SKU: {product.sku})")
    return ProductResponse.from_orm(product)

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Remove from Elasticsearch
    delete_product_elasticsearch(product_id)

    db.delete(product)
    db.commit()

    logger.info(f"Product deleted: {product.name} (SKU: {product.sku})")
    return {"message": "Product deleted successfully"}

# Inventory routes
@app.get("/inventory/logs", response_model=List[InventoryLogResponse])
async def get_inventory_logs(
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    operation_type: Optional[str] = Query(None, description="Filter by operation type"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryLog)

    if product_id:
        query = query.filter(InventoryLog.product_id == product_id)
    if operation_type:
        query = query.filter(InventoryLog.operation_type == operation_type)
    if user_id:
        query = query.filter(InventoryLog.user_id == user_id)
    if start_date:
        query = query.filter(InventoryLog.created_at >= start_date)
    if end_date:
        query = query.filter(InventoryLog.created_at <= end_date)

    offset = (page - 1) * per_page
    logs = query.order_by(InventoryLog.created_at.desc()).offset(offset).limit(per_page).all()

    return [InventoryLogResponse.from_orm(log) for log in logs]

@app.post("/inventory/adjust")
async def adjust_inventory(
    inventory_data: InventoryLogCreate,
    db: Session = Depends(get_db)
):
    # Get current product
    product = db.query(Product).filter(Product.id == inventory_data.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    quantity_before = product.stock_quantity
    quantity_after = quantity_before + inventory_data.quantity_change

    # Validate quantity after adjustment
    if quantity_after < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inventory adjustment would result in negative stock"
        )

    # Update product stock
    product.stock_quantity = quantity_after
    product.updated_at = datetime.utcnow()
    db.commit()

    # Create inventory log
    inventory_log = InventoryLog(
        product_id=inventory_data.product_id,
        operation_type=inventory_data.operation_type,
        quantity_change=inventory_data.quantity_change,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        reason=inventory_data.reason,
        reference_id=inventory_data.reference_id,
        reference_type=inventory_data.reference_type,
        user_id=inventory_data.user_id,
        notes=inventory_data.notes
    )

    db.add(inventory_log)
    db.commit()
    db.refresh(inventory_log)

    # Update Elasticsearch
    index_product_elasticsearch(product)

    # Publish inventory event
    asyncio.create_task(publish_product_event("inventory_updated", {
        "product_id": product.id,
        "sku": product.sku,
        "quantity_before": quantity_before,
        "quantity_after": quantity_after,
        "change": inventory_data.quantity_change
    }))

    logger.info(f"Inventory adjusted for product {product.sku}: {quantity_before} -> {quantity_after}")
    return InventoryLogResponse.from_orm(inventory_log)

# Search routes
@app.get("/search")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    category_id: Optional[int] = Query(None),
    min_price: Optional[Decimal] = Query(None, ge=0),
    max_price: Optional[Decimal] = Query(None, ge=0),
    in_stock: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Search products using Elasticsearch"""
    try:
        # Build Elasticsearch query
        query_body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": q,
                                "fields": ["name^3", "description^2", "brand", "tags"],
                                "fuzziness": "AUTO"
                            }
                        }
                    ],
                    "filter": []
                }
            },
            "from": (page - 1) * per_page,
            "size": per_page,
            "sort": [
                {"_score": {"order": "desc"}},
                {"created_at": {"order": "desc"}}
            ]
        }

        # Add filters
        if category_id:
            query_body["query"]["bool"]["filter"].append({
                "term": {"category_id": category_id}
            })

        if min_price is not None or max_price is not None:
            price_range = {}
            if min_price is not None:
                price_range["gte"] = float(min_price)
            if max_price is not None:
                price_range["lte"] = float(max_price)
            query_body["query"]["bool"]["filter"].append({
                "range": {"price": price_range}
            })

        if in_stock:
            query_body["query"]["bool"]["filter"].append({
                "range": {"stock_quantity": {"gt": 0}}
            })

        # Execute search
        response = es.search(index="products", body=query_body)

        # Get product IDs
        product_ids = [hit["_source"]["id"] for hit in response["hits"]["hits"]]

        if not product_ids:
            return {"products": [], "total": 0, "page": page, "per_page": per_page}

        # Fetch products from database
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()

        # Maintain search order
        product_map = {p.id: p for p in products}
        ordered_products = [product_map[pid] for pid in product_ids if pid in product_map]

        return {
            "products": [ProductResponse.from_orm(p) for p in ordered_products],
            "total": response["hits"]["total"]["value"],
            "page": page,
            "per_page": per_page,
            "search_time": response["took"]
        }

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search service temporarily unavailable"
        )

# Analytics routes
@app.get("/analytics/low-stock")
async def get_low_stock_products(
    threshold: int = Query(10, ge=1),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.stock_quantity <= threshold,
        Product.is_active == True
    ).order_by(Product.stock_quantity.asc()).all()

    return {
        "products": [ProductResponse.from_orm(p) for p in products],
        "threshold": threshold,
        "count": len(products)
    }

@app.get("/analytics/out-of-stock")
async def get_out_of_stock_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.stock_quantity == 0,
        Product.is_active == True
    ).all()

    return {
        "products": [ProductResponse.from_orm(p) for p in products],
        "count": len(products)
    }

@app.get("/analytics/popular")
async def get_popular_products(
    limit: int = Query(10, ge=1, le=100),
    timeframe_days: int = Query(30, ge=1),
    db: Session = Depends(get_db)
):
    # This would require order data - for now return featured products
    products = db.query(Product).filter(
        Product.is_featured == True,
        Product.is_active == True
    ).order_by(Product.created_at.desc()).limit(limit).all()

    return {
        "products": [ProductResponse.from_orm(p) for p in products],
        "timeframe_days": timeframe_days,
        "count": len(products)
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
        port=8002,
        reload=True,
        log_level="info",
        access_log=True
    )
