#!/usr/bin/env python3
"""
Notification Service Microservice - Email, SMS, push notifications
Built with FastAPI for high-performance notification management in the e-commerce platform
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager
from enum import Enum

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field, EmailStr, validator
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import redis
import aio_pika
import json
import smtplib
import ssl
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from twilio.rest import Client as TwilioClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/var/log/notification_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/yeelo_homeopathy")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "your-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "your-app-password")

# SMS configuration (Twilio)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "your-twilio-sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "your-twilio-token")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Twilio setup
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Enums
class NotificationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WHATSAPP = "whatsapp"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"

class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

# Database Models
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, index=True, nullable=False)  # User ID
    recipient_email = Column(String(255), nullable=True)
    recipient_phone = Column(String(20), nullable=True)
    notification_type = Column(String(20), nullable=False)
    priority = Column(String(10), default=NotificationPriority.NORMAL)
    status = Column(String(20), default=NotificationStatus.PENDING)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    template_id = Column(String(100), nullable=True)
    template_data = Column(JSON, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    type = Column(String(20), nullable=False)
    subject_template = Column(String(255), nullable=False)
    content_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)  # Required template variables
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    notification_type = Column(String(20), nullable=False)
    is_enabled = Column(Boolean, default=True)
    channels = Column(JSON, nullable=True)  # email, sms, push
    frequency = Column(String(20), default="immediate")  # immediate, daily, weekly
    quiet_hours_start = Column(String(5), nullable=True)  # HH:MM
    quiet_hours_end = Column(String(5), nullable=True)  # HH:MM
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic Models
class NotificationCreate(BaseModel):
    recipient_id: int
    recipient_email: Optional[EmailStr] = None
    recipient_phone: Optional[str] = None
    notification_type: str = Field(..., regex="^(email|sms|push|whatsapp)$")
    priority: str = NotificationPriority.NORMAL
    subject: str = Field(..., max_length=255)
    content: str
    template_id: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    recipient_email: Optional[str]
    recipient_phone: Optional[str]
    notification_type: str
    priority: str
    status: str
    subject: str
    content: str
    template_id: Optional[str]
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    error_message: Optional[str]
    metadata: Optional[Dict[str, Any]]
    retry_count: int
    created_at: datetime

class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., regex="^(email|sms|push|whatsapp)$")
    subject_template: str = Field(..., max_length=255)
    content_template: str
    variables: Optional[List[str]] = None

class TemplateResponse(BaseModel):
    id: int
    name: str
    type: str
    subject_template: str
    content_template: str
    variables: Optional[List[str]]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class PreferenceCreate(BaseModel):
    user_id: int
    notification_type: str = Field(..., regex="^(email|sms|push|whatsapp)$")
    is_enabled: bool = True
    channels: Optional[List[str]] = None
    frequency: str = "immediate"
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None

class PreferenceResponse(BaseModel):
    id: int
    user_id: int
    notification_type: str
    is_enabled: bool
    channels: Optional[List[str]]
    frequency: str
    quiet_hours_start: Optional[str]
    quiet_hours_end: Optional[str]
    created_at: datetime
    updated_at: datetime

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def publish_notification_event(event_type: str, notification_data: dict):
    """Publish notification events to message queue"""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            await channel.default_exchange.publish(
                aio_pika.Message(body=json.dumps({
                    "event_type": event_type,
                    "notification_data": notification_data,
                    "timestamp": datetime.utcnow().isoformat()
                }).encode()),
                routing_key="notification.events"
            )
        logger.info(f"Published notification event: {event_type}")
    except Exception as e:
        logger.error(f"Failed to publish notification event: {str(e)}")

async def send_email_notification(to_email: str, subject: str, body: str):
    """Send email notification"""
    try:
        msg = MimeText(body)
        msg['Subject'] = subject
        msg['From'] = SMTP_USERNAME
        msg['To'] = to_email

        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_sms_notification(to_phone: str, message: str):
    """Send SMS notification"""
    try:
        # Remove any non-digit characters from phone number
        clean_phone = ''.join(filter(str.isdigit, to_phone))

        message = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=f"+{clean_phone}"
        )

        logger.info(f"SMS sent successfully to {to_phone}: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
        return False

async def process_notification(notification: Notification):
    """Process a notification based on its type"""
    success = False

    if notification.notification_type == NotificationType.EMAIL:
        success = await send_email_notification(
            notification.recipient_email,
            notification.subject,
            notification.content
        )
    elif notification.notification_type == NotificationType.SMS:
        success = await send_sms_notification(
            notification.recipient_phone,
            notification.content
        )
    elif notification.notification_type == NotificationType.PUSH:
        # Push notification logic would go here
        success = True  # Placeholder
    elif notification.notification_type == NotificationType.WHATSAPP:
        # WhatsApp notification logic would go here
        success = True  # Placeholder

    return success

# API Routes
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Notification Service...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    yield
    # Shutdown
    logger.info("Shutting down Notification Service...")

app = FastAPI(
    title="Notification Service",
    description="Microservice for email, SMS, push notifications",
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
    return {"status": "healthy", "service": "notification-service", "timestamp": datetime.utcnow()}

# Notification routes
@app.post("/notifications", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Check user preferences
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == notification_data.recipient_id,
        NotificationPreference.notification_type == notification_data.notification_type,
        NotificationPreference.is_enabled == True
    ).first()

    if not preferences:
        # Create default preferences if none exist
        preferences = NotificationPreference(
            user_id=notification_data.recipient_id,
            notification_type=notification_data.notification_type,
            is_enabled=True,
            channels=["email"] if notification_data.notification_type == "email" else ["sms"]
        )
        db.add(preferences)
        db.commit()

    # Check if notification type is enabled for user
    if not preferences.is_enabled:
        return {"message": "Notification not sent - user has disabled this notification type"}

    # Check quiet hours
    if preferences.quiet_hours_start and preferences.quiet_hours_end:
        current_time = datetime.utcnow().time()
        quiet_start = datetime.strptime(preferences.quiet_hours_start, "%H:%M").time()
        quiet_end = datetime.strptime(preferences.quiet_hours_end, "%H:%M").time()

        if quiet_start <= current_time <= quiet_end:
            # Schedule for later
            notification_data.scheduled_at = datetime.utcnow() + timedelta(hours=1)

    notification = Notification(
        recipient_id=notification_data.recipient_id,
        recipient_email=notification_data.recipient_email,
        recipient_phone=notification_data.recipient_phone,
        notification_type=notification_data.notification_type,
        priority=notification_data.priority,
        subject=notification_data.subject,
        content=notification_data.content,
        template_id=notification_data.template_id,
        template_data=notification_data.template_data,
        scheduled_at=notification_data.scheduled_at,
        metadata=notification_data.metadata,
        status=NotificationStatus.PENDING
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    # Send immediately if not scheduled
    if not notification.scheduled_at or notification.scheduled_at <= datetime.utcnow():
        background_tasks.add_task(process_notification_async, notification.id)

    logger.info(f"Notification created: {notification.id}")
    return NotificationResponse.from_orm(notification)

@app.get("/notifications/{notification_id}", response_model=NotificationResponse)
async def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return NotificationResponse.from_orm(notification)

@app.get("/users/{user_id}/notifications", response_model=List[NotificationResponse])
async def get_user_notifications(
    user_id: int,
    notification_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.recipient_id == user_id)

    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if status:
        query = query.filter(Notification.status == status)

    offset = (page - 1) * per_page
    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(per_page).all()

    return [NotificationResponse.from_orm(notification) for notification in notifications]

# Template routes
@app.post("/templates", response_model=TemplateResponse)
async def create_template(template_data: TemplateCreate, db: Session = Depends(get_db)):
    template = NotificationTemplate(
        name=template_data.name,
        type=template_data.type,
        subject_template=template_data.subject_template,
        content_template=template_data.content_template,
        variables=template_data.variables,
        is_active=True
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    logger.info(f"Template created: {template.name}")
    return TemplateResponse.from_orm(template)

@app.get("/templates", response_model=List[TemplateResponse])
async def get_templates(
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(NotificationTemplate).filter(NotificationTemplate.is_active == True)

    if type:
        query = query.filter(NotificationTemplate.type == type)

    templates = query.all()
    return [TemplateResponse.from_orm(template) for template in templates]

# Preference routes
@app.post("/preferences", response_model=PreferenceResponse)
async def create_preference(preference_data: PreferenceCreate, db: Session = Depends(get_db)):
    preference = NotificationPreference(
        user_id=preference_data.user_id,
        notification_type=preference_data.notification_type,
        is_enabled=preference_data.is_enabled,
        channels=preference_data.channels,
        frequency=preference_data.frequency,
        quiet_hours_start=preference_data.quiet_hours_start,
        quiet_hours_end=preference_data.quiet_hours_end
    )

    db.add(preference)
    db.commit()
    db.refresh(preference)

    logger.info(f"Preference created for user {preference.user_id}")
    return PreferenceResponse.from_orm(preference)

@app.get("/preferences/users/{user_id}", response_model=List[PreferenceResponse])
async def get_user_preferences(user_id: int, db: Session = Depends(get_db)):
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id
    ).all()
    return [PreferenceResponse.from_orm(preference) for preference in preferences]

@app.put("/preferences/{preference_id}", response_model=PreferenceResponse)
async def update_preference(
    preference_id: int,
    preference_data: PreferenceCreate,
    db: Session = Depends(get_db)
):
    preference = db.query(NotificationPreference).filter(
        NotificationPreference.id == preference_id
    ).first()

    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preference not found"
        )

    # Update fields
    for field, value in preference_data.dict(exclude_unset=True).items():
        setattr(preference, field, value)

    preference.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(preference)

    logger.info(f"Preference updated: {preference.id}")
    return PreferenceResponse.from_orm(preference)

# Bulk operations
@app.post("/notifications/bulk")
async def send_bulk_notifications(
    notifications: List[NotificationCreate],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    created_notifications = []

    for notification_data in notifications:
        notification = Notification(
            recipient_id=notification_data.recipient_id,
            recipient_email=notification_data.recipient_email,
            recipient_phone=notification_data.recipient_phone,
            notification_type=notification_data.notification_type,
            priority=notification_data.priority,
            subject=notification_data.subject,
            content=notification_data.content,
            template_id=notification_data.template_id,
            template_data=notification_data.template_data,
            scheduled_at=notification_data.scheduled_at,
            metadata=notification_data.metadata,
            status=NotificationStatus.PENDING
        )

        db.add(notification)
        created_notifications.append(notification)

    db.commit()

    # Process notifications
    for notification in created_notifications:
        if not notification.scheduled_at or notification.scheduled_at <= datetime.utcnow():
            background_tasks.add_task(process_notification_async, notification.id)

    return {
        "message": f"Bulk notifications created: {len(created_notifications)}",
        "notifications": [NotificationResponse.from_orm(n) for n in created_notifications]
    }

# Analytics routes
@app.get("/analytics/notifications")
async def get_notification_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    notification_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)

    if start_date:
        query = query.filter(Notification.created_at >= start_date)
    if end_date:
        query = query.filter(Notification.created_at <= end_date)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if status:
        query = query.filter(Notification.status == status)

    # Default to last 30 days if no dates provided
    if not start_date and not end_date:
        start_date = datetime.utcnow() - timedelta(days=30)
        query = query.filter(Notification.created_at >= start_date)

    notifications = query.all()

    # Calculate analytics
    total_notifications = len(notifications)
    sent_notifications = len([n for n in notifications if n.status == NotificationStatus.SENT])
    delivered_notifications = len([n for n in notifications if n.status == NotificationStatus.DELIVERED])
    failed_notifications = len([n for n in notifications if n.status == NotificationStatus.FAILED])

    # Type breakdown
    type_breakdown = {}
    for notification in notifications:
        type_breakdown[notification.notification_type] = type_breakdown.get(
            notification.notification_type, 0
        ) + 1

    return {
        "total_notifications": total_notifications,
        "sent_notifications": sent_notifications,
        "delivered_notifications": delivered_notifications,
        "failed_notifications": failed_notifications,
        "success_rate": (delivered_notifications / total_notifications * 100) if total_notifications > 0 else 0,
        "type_breakdown": type_breakdown,
        "date_range": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None
        }
    }

# Background task functions
async def process_notification_async(notification_id: int):
    """Process a notification asynchronously"""
    # This would be called from a background task queue in production
    # For now, we'll simulate the processing
    logger.info(f"Processing notification {notification_id}")

    # In a real implementation, this would:
    # 1. Check user preferences
    # 2. Send the notification
    # 3. Update status
    # 4. Handle retries if needed

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
        port=8005,
        reload=True,
        log_level="info",
        access_log=True
    )
