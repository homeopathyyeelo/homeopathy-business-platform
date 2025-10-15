"""
Kafka Consumer for AI Service
Handles event-driven AI automation
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

from kafka import KafkaConsumer as KafkaConsumerClient
from kafka.errors import KafkaError

from .database import DatabaseManager
from .content_generation import ContentGenerationService
from .forecasting import DemandForecastingService
from .pricing import DynamicPricingService

logger = logging.getLogger(__name__)

class KafkaConsumer:
    def __init__(
        self,
        db_manager: DatabaseManager,
        content_service: ContentGenerationService,
        forecasting_service: DemandForecastingService,
        pricing_service: DynamicPricingService
    ):
        self.db_manager = db_manager
        self.content_service = content_service
        self.forecasting_service = forecasting_service
        self.pricing_service = pricing_service
        
        self.consumer = None
        self.running = False
        
        # Kafka configuration
        self.bootstrap_servers = ["kafka:9092"]
        self.topics = [
            "campaigns.events",
            "inventory.events", 
            "orders.events",
            "purchase.events",
            "ai.events"
        ]
        
    async def start(self):
        """Start Kafka consumer"""
        try:
            self.consumer = KafkaConsumerClient(
                *self.topics,
                bootstrap_servers=self.bootstrap_servers,
                group_id="ai-service-group",
                auto_offset_reset="latest",
                enable_auto_commit=True,
                value_deserializer=lambda x: json.loads(x.decode('utf-8')) if x else None
            )
            
            self.running = True
            logger.info("Kafka consumer started")
            
            # Start consuming messages
            await self.consume_messages()
            
        except Exception as e:
            logger.error(f"Error starting Kafka consumer: {str(e)}")
            raise
    
    async def stop(self):
        """Stop Kafka consumer"""
        try:
            self.running = False
            if self.consumer:
                self.consumer.close()
            logger.info("Kafka consumer stopped")
        except Exception as e:
            logger.error(f"Error stopping Kafka consumer: {str(e)}")
    
    async def consume_messages(self):
        """Consume messages from Kafka topics"""
        try:
            while self.running:
                message_batch = self.consumer.poll(timeout_ms=1000)
                
                for topic_partition, messages in message_batch.items():
                    for message in messages:
                        await self.process_message(topic_partition.topic, message.value)
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
                
        except Exception as e:
            logger.error(f"Error consuming messages: {str(e)}")
            raise
    
    async def process_message(self, topic: str, message: Dict[str, Any]):
        """Process individual Kafka message"""
        try:
            event_type = message.get("event_type", "")
            payload = message.get("payload", {})
            
            logger.info(f"Processing event: {event_type} from topic: {topic}")
            
            # Route events to appropriate handlers
            if topic == "campaigns.events":
                await self.handle_campaign_event(event_type, payload)
            elif topic == "inventory.events":
                await self.handle_inventory_event(event_type, payload)
            elif topic == "orders.events":
                await self.handle_order_event(event_type, payload)
            elif topic == "purchase.events":
                await self.handle_purchase_event(event_type, payload)
            elif topic == "ai.events":
                await self.handle_ai_event(event_type, payload)
            else:
                logger.warning(f"Unknown topic: {topic}")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            # Don't raise - continue processing other messages
    
    async def handle_campaign_event(self, event_type: str, payload: Dict[str, Any]):
        """Handle campaign-related events"""
        try:
            if event_type == "campaign.created":
                await self.generate_campaign_content(payload)
            elif event_type == "campaign.scheduled":
                await self.optimize_campaign_timing(payload)
            else:
                logger.info(f"Unhandled campaign event: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling campaign event: {str(e)}")
    
    async def handle_inventory_event(self, event_type: str, payload: Dict[str, Any]):
        """Handle inventory-related events"""
        try:
            if event_type == "inventory.low":
                await self.trigger_demand_forecast(payload)
            elif event_type == "inventory.expiring":
                await self.suggest_dynamic_pricing(payload)
            elif event_type == "inventory.anomaly":
                await self.analyze_inventory_anomaly(payload)
            else:
                logger.info(f"Unhandled inventory event: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling inventory event: {str(e)}")
    
    async def handle_order_event(self, event_type: str, payload: Dict[str, Any]):
        """Handle order-related events"""
        try:
            if event_type == "order.created":
                await self.suggest_product_recommendations(payload)
            elif event_type == "order.completed":
                await self.trigger_follow_up_campaign(payload)
            else:
                logger.info(f"Unhandled order event: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling order event: {str(e)}")
    
    async def handle_purchase_event(self, event_type: str, payload: Dict[str, Any]):
        """Handle purchase-related events"""
        try:
            if event_type == "purchaseorder.recommendation":
                await self.optimize_purchase_order(payload)
            elif event_type == "purchaseorder.received":
                await self.update_forecasting_models(payload)
            else:
                logger.info(f"Unhandled purchase event: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling purchase event: {str(e)}")
    
    async def handle_ai_event(self, event_type: str, payload: Dict[str, Any]):
        """Handle AI-related events"""
        try:
            if event_type == "ai.requested":
                await self.process_ai_request(payload)
            elif event_type == "ai.completed":
                await self.log_ai_completion(payload)
            else:
                logger.info(f"Unhandled AI event: {event_type}")
                
        except Exception as e:
            logger.error(f"Error handling AI event: {str(e)}")
    
    # Event handler implementations
    async def generate_campaign_content(self, payload: Dict[str, Any]):
        """Generate content for new campaign"""
        try:
            campaign_id = payload.get("campaign_id")
            campaign_type = payload.get("type", "promotional")
            target_audience = payload.get("target_audience", {})
            
            # Generate campaign content
            content = await self.content_service.generate_campaign({
                "campaign_id": campaign_id,
                "type": campaign_type,
                "target_audience": target_audience
            })
            
            # Publish campaign.generated event
            await self.publish_event("campaigns.events", "campaign.generated", {
                "campaign_id": campaign_id,
                "content": content,
                "generated_at": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Generated content for campaign {campaign_id}")
            
        except Exception as e:
            logger.error(f"Error generating campaign content: {str(e)}")
    
    async def trigger_demand_forecast(self, payload: Dict[str, Any]):
        """Trigger demand forecast for low inventory"""
        try:
            product_id = payload.get("product_id")
            shop_id = payload.get("shop_id")
            
            if not product_id or not shop_id:
                logger.warning("Missing product_id or shop_id in inventory.low event")
                return
            
            # Generate demand forecast
            forecast = await self.forecasting_service.forecast_demand(
                product_id=product_id,
                shop_id=shop_id,
                days_ahead=30
            )
            
            # Publish forecast result
            await self.publish_event("ai.events", "forecast.completed", {
                "product_id": product_id,
                "shop_id": shop_id,
                "forecast": forecast,
                "triggered_by": "inventory.low"
            })
            
            logger.info(f"Generated demand forecast for product {product_id}")
            
        except Exception as e:
            logger.error(f"Error triggering demand forecast: {str(e)}")
    
    async def suggest_dynamic_pricing(self, payload: Dict[str, Any]):
        """Suggest dynamic pricing for expiring inventory"""
        try:
            product_id = payload.get("product_id")
            current_price = payload.get("current_price", 0)
            current_stock = payload.get("current_stock", 0)
            expiry_date = payload.get("expiry_date")
            
            if not product_id:
                logger.warning("Missing product_id in inventory.expiring event")
                return
            
            # Calculate optimal pricing
            pricing = await self.pricing_service.calculate_optimal_pricing(
                product_id=product_id,
                current_price=current_price,
                current_stock=current_stock,
                expiry_date=datetime.fromisoformat(expiry_date) if expiry_date else None,
                demand_forecast=0,  # Will be calculated internally
                cost_price=current_price * 0.6  # Estimate
            )
            
            # Publish pricing suggestion
            await self.publish_event("ai.events", "pricing.suggested", {
                "product_id": product_id,
                "pricing": pricing,
                "triggered_by": "inventory.expiring"
            })
            
            logger.info(f"Generated pricing suggestion for product {product_id}")
            
        except Exception as e:
            logger.error(f"Error suggesting dynamic pricing: {str(e)}")
    
    async def suggest_product_recommendations(self, payload: Dict[str, Any]):
        """Suggest product recommendations for new order"""
        try:
            customer_id = payload.get("customer_id")
            order_items = payload.get("items", [])
            
            if not customer_id or not order_items:
                logger.warning("Missing customer_id or items in order.created event")
                return
            
            # Generate product recommendations
            recommendations = await self.content_service.generate_product_recommendations({
                "customer_id": customer_id,
                "order_items": order_items
            })
            
            # Publish recommendations
            await self.publish_event("ai.events", "recommendations.generated", {
                "customer_id": customer_id,
                "order_id": payload.get("order_id"),
                "recommendations": recommendations
            })
            
            logger.info(f"Generated recommendations for customer {customer_id}")
            
        except Exception as e:
            logger.error(f"Error generating product recommendations: {str(e)}")
    
    async def optimize_purchase_order(self, payload: Dict[str, Any]):
        """Optimize purchase order recommendations"""
        try:
            # This would analyze the recommended purchase order
            # and suggest optimizations based on vendor performance,
            # seasonal trends, etc.
            
            logger.info("Optimizing purchase order recommendations")
            
        except Exception as e:
            logger.error(f"Error optimizing purchase order: {str(e)}")
    
    async def publish_event(self, topic: str, event_type: str, payload: Dict[str, Any]):
        """Publish event to Kafka topic"""
        try:
            # In a real implementation, you would use a Kafka producer here
            # For now, we'll just log the event
            logger.info(f"Would publish event {event_type} to topic {topic}: {payload}")
            
        except Exception as e:
            logger.error(f"Error publishing event: {str(e)}")
    
    async def health_check(self) -> bool:
        """Check Kafka consumer health"""
        try:
            return self.running and self.consumer is not None
        except Exception as e:
            logger.error(f"Kafka consumer health check failed: {str(e)}")
            return False
