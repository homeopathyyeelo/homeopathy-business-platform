"""
AI Model Manager for Yeelo AI Service
Handles local and remote AI model inference
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
import json
import uuid
from datetime import datetime

import httpx
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

logger = logging.getLogger(__name__)

class AIModelManager:
    def __init__(self):
        self.models = {}
        self.local_models = {}
        self.openai_client = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def initialize(self):
        """Initialize AI model manager"""
        try:
            # Initialize OpenAI client if API key is available
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                import openai
                self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized")
            
            # Load local models if available
            await self.load_local_models()
            
            logger.info(f"AI Model Manager initialized with device: {self.device}")
            
        except Exception as e:
            logger.error(f"Error initializing AI Model Manager: {str(e)}")
            raise
    
    async def load_local_models(self):
        """Load local models for inference"""
        try:
            # For development, we'll use a lightweight model
            # In production, you would load your fine-tuned models here
            model_name = "microsoft/DialoGPT-medium"  # Lightweight model for testing
            
            if self.device == "cuda":
                # Load model on GPU
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16,
                    device_map="auto"
                )
            else:
                # Load model on CPU
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForCausalLM.from_pretrained(model_name)
            
            # Create text generation pipeline
            generator = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device=0 if self.device == "cuda" else -1
            )
            
            self.local_models["llama-13b-instruct"] = {
                "pipeline": generator,
                "tokenizer": tokenizer,
                "model": model
            }
            
            logger.info(f"Loaded local model: {model_name}")
            
        except Exception as e:
            logger.warning(f"Could not load local models: {str(e)}")
            # Continue without local models - will use OpenAI API
    
    async def generate(
        self,
        prompt: str,
        model: str = "llama-13b-instruct",
        max_tokens: int = 256,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text using specified model"""
        try:
            request_id = str(uuid.uuid4())
            
            # Try local model first
            if model in self.local_models:
                result = await self.generate_local(
                    prompt=prompt,
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                )
            elif self.openai_client:
                result = await self.generate_openai(
                    prompt=prompt,
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                )
            else:
                # Fallback to mock response for development
                result = await self.generate_mock(
                    prompt=prompt,
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                )
            
            result["id"] = request_id
            result["model"] = model
            result["timestamp"] = datetime.utcnow().isoformat()
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            raise
    
    async def generate_local(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text using local model"""
        try:
            model_info = self.local_models[model]
            generator = model_info["pipeline"]
            
            # Generate text
            result = generator(
                prompt,
                max_length=len(prompt.split()) + max_tokens,
                temperature=temperature,
                do_sample=True,
                pad_token_id=model_info["tokenizer"].eos_token_id,
                num_return_sequences=1
            )
            
            generated_text = result[0]["generated_text"]
            response_text = generated_text[len(prompt):].strip()
            
            # Estimate token count
            tokens_used = len(response_text.split())
            
            return {
                "text": response_text,
                "tokens_used": tokens_used,
                "metadata": {
                    "model_type": "local",
                    "device": self.device
                }
            }
            
        except Exception as e:
            logger.error(f"Error with local generation: {str(e)}")
            raise
    
    async def generate_openai(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text using OpenAI API"""
        try:
            # Map model names to OpenAI models
            openai_model_map = {
                "llama-13b-instruct": "gpt-3.5-turbo",
                "gpt-4": "gpt-4",
                "gpt-3.5-turbo": "gpt-3.5-turbo"
            }
            
            openai_model = openai_model_map.get(model, "gpt-3.5-turbo")
            
            response = await self.openai_client.chat.completions.create(
                model=openai_model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for a homeopathy business platform."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return {
                "text": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "metadata": {
                    "model_type": "openai",
                    "openai_model": openai_model
                }
            }
            
        except Exception as e:
            logger.error(f"Error with OpenAI generation: {str(e)}")
            raise
    
    async def generate_mock(
        self,
        prompt: str,
        model: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate mock response for development/testing"""
        # This is a simple mock for development
        mock_responses = {
            "product_description": "This is a high-quality homeopathy product that provides natural relief for various health conditions. Made with carefully selected ingredients, it offers safe and effective treatment options.",
            "campaign_content": "🌟 Discover the power of natural healing! Our homeopathy products offer safe, effective relief for your health concerns. Order now and experience the difference! 💚",
            "forecast": "Based on historical data and seasonal trends, we predict increased demand for this product in the coming weeks.",
            "pricing": "Considering current market conditions and inventory levels, we recommend adjusting the price to optimize sales and profitability."
        }
        
        # Simple keyword matching for mock responses
        prompt_lower = prompt.lower()
        if "product" in prompt_lower and "description" in prompt_lower:
            response_text = mock_responses["product_description"]
        elif "campaign" in prompt_lower or "marketing" in prompt_lower:
            response_text = mock_responses["campaign_content"]
        elif "forecast" in prompt_lower or "demand" in prompt_lower:
            response_text = mock_responses["forecast"]
        elif "price" in prompt_lower or "pricing" in prompt_lower:
            response_text = mock_responses["pricing"]
        else:
            response_text = "This is a mock AI response for development purposes. The actual AI model would generate more sophisticated content based on your specific requirements."
        
        return {
            "text": response_text,
            "tokens_used": len(response_text.split()),
            "metadata": {
                "model_type": "mock",
                "note": "This is a development mock response"
            }
        }
    
    async def embed_texts(self, texts: List[str], model: str = "embed-small-v1") -> List[List[float]]:
        """Create embeddings for texts"""
        try:
            # For development, return mock embeddings
            # In production, you would use a proper embedding model
            embeddings = []
            for text in texts:
                # Generate mock embedding (1536 dimensions like OpenAI embeddings)
                import random
                random.seed(hash(text))  # Deterministic for same text
                embedding = [random.uniform(-1, 1) for _ in range(1536)]
                embeddings.append(embedding)
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error creating embeddings: {str(e)}")
            raise
    
    async def health_check(self) -> bool:
        """Check AI model health"""
        try:
            # Test with a simple generation
            test_result = await self.generate(
                prompt="Test prompt",
                model="llama-13b-instruct",
                max_tokens=10
            )
            return "text" in test_result
        except Exception as e:
            logger.error(f"AI model health check failed: {str(e)}")
            return False
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models"""
        models = []
        
        # Add local models
        for model_name in self.local_models.keys():
            models.append({
                "name": model_name,
                "type": "local",
                "status": "ready"
            })
        
        # Add OpenAI models if available
        if self.openai_client:
            models.extend([
                {"name": "gpt-4", "type": "openai", "status": "ready"},
                {"name": "gpt-3.5-turbo", "type": "openai", "status": "ready"}
            ])
        
        # Add mock model for development
        models.append({
            "name": "mock-model",
            "type": "mock",
            "status": "ready"
        })
        
        return models
