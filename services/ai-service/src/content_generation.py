"""
Content Generation Service
Handles AI-powered content creation for marketing and communication
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
import json
import uuid
from datetime import datetime

from .ai_models import AIModelManager
from .rag import RAGService

logger = logging.getLogger(__name__)

class ContentGenerationService:
    def __init__(self, ai_models: AIModelManager, rag_service: RAGService):
        self.ai_models = ai_models
        self.rag_service = rag_service
        
    async def initialize(self):
        """Initialize content generation service"""
        try:
            logger.info("Content generation service initialized")
        except Exception as e:
            logger.error(f"Error initializing content generation service: {str(e)}")
            raise
    
    async def generate(
        self,
        prompt: str,
        model: str = "llama-13b-instruct",
        max_tokens: int = 256,
        temperature: float = 0.7,
        context_documents: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate content using AI models"""
        try:
            # Enhance prompt with context if available
            enhanced_prompt = prompt
            if context_documents:
                context = self.build_context_string(context_documents)
                enhanced_prompt = f"Context: {context}\n\nPrompt: {prompt}"
            
            # Generate content
            result = await self.ai_models.generate(
                prompt=enhanced_prompt,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}")
            raise
    
    async def generate_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate marketing campaign content"""
        try:
            campaign_type = campaign_data.get("type", "promotional")
            target_audience = campaign_data.get("target_audience", {})
            products = campaign_data.get("products", [])
            
            # Build campaign prompt
            prompt = self.build_campaign_prompt(campaign_type, target_audience, products)
            
            # Generate content
            result = await self.generate(prompt, max_tokens=512, temperature=0.8)
            
            # Parse and structure the response
            campaign_content = self.parse_campaign_response(result["text"], campaign_type)
            
            return {
                "campaign_id": campaign_data.get("campaign_id"),
                "type": campaign_type,
                "content": campaign_content,
                "generated_at": datetime.utcnow().isoformat(),
                "metadata": result.get("metadata", {})
            }
            
        except Exception as e:
            logger.error(f"Error generating campaign: {str(e)}")
            raise
    
    async def generate_product_description(self, product_data: Dict[str, Any]) -> str:
        """Generate product description"""
        try:
            name = product_data.get("name", "")
            category = product_data.get("category", "")
            potency = product_data.get("potency", "")
            indications = product_data.get("indications", [])
            target_audience = product_data.get("target_audience", "general")
            tone = product_data.get("tone", "professional")
            
            prompt = f"""Create a compelling product description for a homeopathy product:

Product Name: {name}
Category: {category}
Potency: {potency}
Indications: {', '.join(indications) if indications else 'General health support'}
Target Audience: {target_audience}

Requirements:
- Write in a {tone} tone
- Include benefits and usage instructions
- Mention safety and natural healing aspects
- Keep it between 150-250 words
- Make it SEO-friendly
- Include a compelling call-to-action
- Ensure compliance with homeopathy regulations

Format the response as a clean product description without any markdown formatting."""
            
            result = await self.generate(prompt, max_tokens=400, temperature=0.7)
            return result["text"]
            
        except Exception as e:
            logger.error(f"Error generating product description: {str(e)}")
            raise
    
    async def generate_social_media_post(
        self, 
        content_type: str, 
        product_data: Dict[str, Any],
        platform: str = "instagram"
    ) -> Dict[str, Any]:
        """Generate social media post content"""
        try:
            prompt = self.build_social_media_prompt(content_type, product_data, platform)
            
            result = await self.generate(prompt, max_tokens=300, temperature=0.8)
            
            # Parse response for different elements
            post_content = self.parse_social_media_response(result["text"], platform)
            
            return {
                "platform": platform,
                "content_type": content_type,
                "post": post_content,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating social media post: {str(e)}")
            raise
    
    async def generate_whatsapp_message(
        self, 
        message_type: str, 
        context: Dict[str, Any]
    ) -> str:
        """Generate WhatsApp message content"""
        try:
            prompt = self.build_whatsapp_prompt(message_type, context)
            
            result = await self.generate(prompt, max_tokens=200, temperature=0.7)
            return result["text"]
            
        except Exception as e:
            logger.error(f"Error generating WhatsApp message: {str(e)}")
            raise
    
    async def generate_product_recommendations(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate product recommendations"""
        try:
            customer_id = context.get("customer_id")
            order_items = context.get("order_items", [])
            
            # Build recommendation prompt
            prompt = f"""Based on the following order items, suggest complementary homeopathy products:

Order Items: {json.dumps(order_items)}

Provide 3-5 product recommendations with:
- Product name
- Reason for recommendation
- Brief benefit description

Format as JSON array with keys: name, reason, benefit"""
            
            result = await self.generate(prompt, max_tokens=400, temperature=0.6)
            
            # Parse JSON response
            try:
                recommendations = json.loads(result["text"])
                return recommendations if isinstance(recommendations, list) else []
            except json.JSONDecodeError:
                # Fallback to mock recommendations
                return self.get_mock_recommendations(order_items)
            
        except Exception as e:
            logger.error(f"Error generating product recommendations: {str(e)}")
            return []
    
    def build_campaign_prompt(
        self, 
        campaign_type: str, 
        target_audience: Dict[str, Any], 
        products: List[Dict[str, Any]]
    ) -> str:
        """Build prompt for campaign generation"""
        audience_desc = target_audience.get("description", "general customers")
        age_range = target_audience.get("age_range", "")
        location = target_audience.get("location", "")
        
        product_names = [p.get("name", "") for p in products]
        
        return f"""Create a {campaign_type} marketing campaign for a homeopathy business:

Target Audience: {audience_desc}
Age Range: {age_range}
Location: {location}
Products: {', '.join(product_names)}

Generate:
1. Campaign theme and key message
2. Instagram caption (40-80 words)
3. WhatsApp message (2-3 lines)
4. Email subject line
5. Call-to-action suggestions

Make it engaging, authentic, and focused on natural healing benefits."""
    
    def build_social_media_prompt(
        self, 
        content_type: str, 
        product_data: Dict[str, Any], 
        platform: str
    ) -> str:
        """Build prompt for social media content"""
        name = product_data.get("name", "")
        benefits = product_data.get("benefits", [])
        
        if platform == "instagram":
            return f"""Create an Instagram post for homeopathy product: {name}

Benefits: {', '.join(benefits)}

Include:
- Engaging caption (40-80 words)
- 5-7 relevant hashtags
- Emoji usage
- Call-to-action

Make it visually appealing and authentic."""
        
        elif platform == "facebook":
            return f"""Create a Facebook post for homeopathy product: {name}

Benefits: {', '.join(benefits)}

Include:
- Informative caption (100-150 words)
- Educational content about homeopathy
- Call-to-action
- Community engagement elements"""
        
        else:
            return f"""Create a {platform} post for homeopathy product: {name}

Benefits: {', '.join(benefits)}

Make it appropriate for the platform and engaging."""
    
    def build_whatsapp_prompt(self, message_type: str, context: Dict[str, Any]) -> str:
        """Build prompt for WhatsApp messages"""
        if message_type == "order_confirmation":
            return """Create a WhatsApp order confirmation message:

- Friendly and personal tone
- Confirm order details
- Provide estimated delivery time
- Include contact information
- Keep it concise (2-3 lines)"""
        
        elif message_type == "follow_up":
            return """Create a WhatsApp follow-up message after product delivery:

- Ask about customer experience
- Offer support if needed
- Suggest related products
- Keep it warm and helpful (2-3 lines)"""
        
        elif message_type == "promotional":
            return """Create a WhatsApp promotional message:

- Highlight special offer
- Mention product benefits
- Include clear call-to-action
- Keep it concise and engaging (2-3 lines)"""
        
        else:
            return f"""Create a WhatsApp {message_type} message:

- Professional yet friendly tone
- Clear and concise
- Include relevant information
- Keep it under 3 lines"""
    
    def build_context_string(self, documents: List[Dict[str, Any]]) -> str:
        """Build context string from documents"""
        context_parts = []
        for doc in documents:
            context_parts.append(doc.get("text", ""))
        return "\n\n".join(context_parts)
    
    def parse_campaign_response(self, response: str, campaign_type: str) -> Dict[str, Any]:
        """Parse AI response for campaign content"""
        # Simple parsing - in production, you'd use more sophisticated parsing
        lines = response.split('\n')
        
        content = {
            "theme": "",
            "instagram_caption": "",
            "whatsapp_message": "",
            "email_subject": "",
            "call_to_action": ""
        }
        
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "theme" in line.lower() or "message" in line.lower():
                current_section = "theme"
            elif "instagram" in line.lower():
                current_section = "instagram_caption"
            elif "whatsapp" in line.lower():
                current_section = "whatsapp_message"
            elif "email" in line.lower():
                current_section = "email_subject"
            elif "call" in line.lower() or "cta" in line.lower():
                current_section = "call_to_action"
            elif current_section and line:
                content[current_section] += line + " "
        
        # Clean up content
        for key in content:
            content[key] = content[key].strip()
        
        return content
    
    def parse_social_media_response(self, response: str, platform: str) -> Dict[str, Any]:
        """Parse AI response for social media content"""
        if platform == "instagram":
            # Extract caption and hashtags
            lines = response.split('\n')
            caption = ""
            hashtags = []
            
            for line in lines:
                line = line.strip()
                if line.startswith('#'):
                    hashtags.append(line)
                elif line and not line.startswith('#'):
                    caption += line + " "
            
            return {
                "caption": caption.strip(),
                "hashtags": hashtags,
                "emoji_count": sum(1 for c in caption if ord(c) > 127)
            }
        
        else:
            return {
                "content": response.strip(),
                "word_count": len(response.split())
            }
    
    def get_mock_recommendations(self, order_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get mock product recommendations"""
        return [
            {
                "name": "Immune Support Drops",
                "reason": "Complements your current order for overall wellness",
                "benefit": "Boosts natural immunity and helps prevent seasonal illnesses"
            },
            {
                "name": "Digestive Health Tablets",
                "reason": "Often used together with your selected products",
                "benefit": "Supports healthy digestion and gut health"
            },
            {
                "name": "Stress Relief Tincture",
                "reason": "Popular add-on for complete wellness routine",
                "benefit": "Helps manage daily stress and promotes relaxation"
            }
        ]
