"""
Content Agent for AI-powered content generation
Handles social media posts, product descriptions, and marketing content
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json

from ..ai_models import AIModelManager
from ..rag import RAGService
from ..database import DatabaseManager

logger = logging.getLogger(__name__)

class ContentAgent:
    def __init__(self, ai_models: AIModelManager, rag_service: RAGService, db_manager: DatabaseManager):
        self.ai_models = ai_models
        self.rag_service = rag_service
        self.db_manager = db_manager
        
    async def generate_daily_content(self, shop_id: str) -> Dict[str, Any]:
        """Generate daily social media content for a shop"""
        try:
            # Get shop information
            shop = await self.db_manager.get_shop(shop_id)
            if not shop:
                raise ValueError(f"Shop {shop_id} not found")
            
            # Get recent products and orders for context
            recent_products = await self.db_manager.get_recent_products(shop_id, limit=5)
            recent_orders = await self.db_manager.get_recent_orders(shop_id, limit=3)
            
            # Generate content for different platforms
            content = {
                "instagram": await self._generate_instagram_content(shop, recent_products),
                "facebook": await self._generate_facebook_content(shop, recent_products),
                "whatsapp": await self._generate_whatsapp_content(shop, recent_orders),
                "gmb": await self._generate_gmb_content(shop, recent_products),
            }
            
            # Save generated content
            await self._save_generated_content(shop_id, content)
            
            return {
                "success": True,
                "content": content,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating daily content: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _generate_instagram_content(self, shop: Dict, products: List[Dict]) -> Dict[str, Any]:
        """Generate Instagram post content"""
        prompt = f"""
        Create an engaging Instagram post for a homeopathy business:
        
        Shop: {shop['name']}
        Location: {shop.get('address', '')}
        Recent Products: {[p['name'] for p in products]}
        
        Requirements:
        - Write in a warm, professional tone
        - Include relevant hashtags for homeopathy
        - Mention the benefits of homeopathic treatment
        - Keep it under 2200 characters
        - Include a call-to-action
        
        Format as JSON with: caption, hashtags, call_to_action
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=500,
            temperature=0.7
        )
        
        return {
            "platform": "instagram",
            "content": response["text"],
            "type": "post",
            "scheduled_for": datetime.utcnow() + timedelta(hours=2)
        }
    
    async def _generate_facebook_content(self, shop: Dict, products: List[Dict]) -> Dict[str, Any]:
        """Generate Facebook post content"""
        prompt = f"""
        Create a Facebook post for a homeopathy business:
        
        Shop: {shop['name']}
        Recent Products: {[p['name'] for p in products]}
        
        Requirements:
        - Write in a friendly, informative tone
        - Include educational content about homeopathy
        - Mention specific products or services
        - Include a call-to-action
        - Keep it engaging and shareable
        
        Format as JSON with: post_text, call_to_action, image_suggestion
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=400,
            temperature=0.7
        )
        
        return {
            "platform": "facebook",
            "content": response["text"],
            "type": "post",
            "scheduled_for": datetime.utcnow() + timedelta(hours=4)
        }
    
    async def _generate_whatsapp_content(self, shop: Dict, orders: List[Dict]) -> Dict[str, Any]:
        """Generate WhatsApp broadcast content"""
        prompt = f"""
        Create a WhatsApp broadcast message for a homeopathy business:
        
        Shop: {shop['name']}
        Recent Orders: {len(orders)} orders processed
        
        Requirements:
        - Write in Hindi/English mix (Hinglish)
        - Keep it personal and conversational
        - Include health tips or product recommendations
        - Mention special offers or new arrivals
        - Keep it under 160 characters per message
        - Include emojis appropriately
        
        Format as JSON with: message_text, follow_up_message
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=300,
            temperature=0.8
        )
        
        return {
            "platform": "whatsapp",
            "content": response["text"],
            "type": "broadcast",
            "scheduled_for": datetime.utcnow() + timedelta(hours=6)
        }
    
    async def _generate_gmb_content(self, shop: Dict, products: List[Dict]) -> Dict[str, Any]:
        """Generate Google My Business post content"""
        prompt = f"""
        Create a Google My Business post for a homeopathy business:
        
        Shop: {shop['name']}
        Address: {shop.get('address', '')}
        Recent Products: {[p['name'] for p in products]}
        
        Requirements:
        - Write in a professional, local business tone
        - Include location-specific information
        - Mention services and products
        - Include a call-to-action for visits
        - Keep it concise and informative
        
        Format as JSON with: post_text, call_to_action, business_hours_note
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=250,
            temperature=0.6
        )
        
        return {
            "platform": "gmb",
            "content": response["text"],
            "type": "post",
            "scheduled_for": datetime.utcnow() + timedelta(hours=8)
        }
    
    async def generate_product_description(self, product_data: Dict[str, Any]) -> str:
        """Generate SEO-optimized product description"""
        prompt = f"""
        Create a detailed product description for a homeopathic medicine:
        
        Product: {product_data.get('name', '')}
        Category: {product_data.get('category', '')}
        Potency: {product_data.get('potency', '')}
        Indications: {product_data.get('indications', '')}
        
        Requirements:
        - Write in a professional, medical tone
        - Include key benefits and uses
        - Mention dosage information if available
        - Include relevant keywords for SEO
        - Keep it informative but accessible
        - Length: 150-300 words
        
        Focus on the therapeutic benefits and proper usage.
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=400,
            temperature=0.5
        )
        
        return response["text"]
    
    async def generate_campaign_content(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate marketing campaign content"""
        prompt = f"""
        Create a comprehensive marketing campaign for a homeopathy business:
        
        Campaign Type: {campaign_data.get('type', 'general')}
        Target Audience: {campaign_data.get('audience', 'general public')}
        Products: {campaign_data.get('products', [])}
        Season: {campaign_data.get('season', 'general')}
        
        Requirements:
        - Create content for multiple channels (WhatsApp, SMS, Instagram, Facebook)
        - Include seasonal health tips
        - Mention specific products or services
        - Include calls-to-action
        - Adapt tone for each platform
        - Include timing suggestions
        
        Format as JSON with separate content for each platform.
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=800,
            temperature=0.7
        )
        
        return json.loads(response["text"])
    
    async def _save_generated_content(self, shop_id: str, content: Dict[str, Any]):
        """Save generated content to database"""
        try:
            for platform, platform_content in content.items():
                await self.db_manager.save_ai_content({
                    "shop_id": shop_id,
                    "content_type": "social_media",
                    "platform": platform,
                    "content": platform_content["content"],
                    "scheduled_for": platform_content.get("scheduled_for"),
                    "status": "generated",
                    "metadata": {
                        "type": platform_content.get("type"),
                        "generated_at": datetime.utcnow().isoformat()
                    }
                })
        except Exception as e:
            logger.error(f"Error saving generated content: {str(e)}")
    
    async def optimize_content_performance(self, content_id: str) -> Dict[str, Any]:
        """Analyze and optimize content performance"""
        try:
            # Get content performance data
            performance_data = await self.db_manager.get_content_performance(content_id)
            
            if not performance_data:
                return {"success": False, "error": "No performance data found"}
            
            # Generate optimization suggestions
            prompt = f"""
            Analyze the performance of this social media content and provide optimization suggestions:
            
            Content: {performance_data.get('content', '')}
            Platform: {performance_data.get('platform', '')}
            Engagement: {performance_data.get('engagement_rate', 0)}%
            Reach: {performance_data.get('reach', 0)}
            Clicks: {performance_data.get('clicks', 0)}
            
            Provide specific suggestions for:
            1. Content improvement
            2. Timing optimization
            3. Hashtag strategy
            4. Call-to-action enhancement
            5. Audience targeting
            
            Format as JSON with actionable recommendations.
            """
            
            response = await self.ai_models.generate_content(
                prompt=prompt,
                model="gpt-4",
                max_tokens=500,
                temperature=0.6
            )
            
            return {
                "success": True,
                "optimization_suggestions": json.loads(response["text"]),
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error optimizing content performance: {str(e)}")
            return {"success": False, "error": str(e)}
