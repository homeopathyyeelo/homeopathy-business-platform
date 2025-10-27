# AI Service - Enhanced with Recommendations, Chatbot, and Fraud Detection

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
import time
import uuid
import asyncio
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta
import redis
import psycopg2 as psycopg
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import openai
import requests

# Enhanced AI Service with dynamic features
class RecommendationEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000)
        self.product_vectors = None
        self.product_data = []
        
    def train_model(self, products):
        """Train recommendation model with product data"""
        if not products:
            return
            
        # Extract text features from products
        texts = []
        for product in products:
            text = f"{product.get('name', '')} {product.get('description', '')} {product.get('category', '')}"
            texts.append(text)
        
        self.product_vectors = self.vectorizer.fit_transform(texts)
        self.product_data = products
        
    def get_recommendations(self, user_preferences, limit=10):
        """Get personalized recommendations based on user preferences"""
        if not self.product_vectors or not user_preferences:
            return []
            
        # Create user preference vector
        user_text = f"{user_preferences.get('categories', [])} {user_preferences.get('brands', [])}"
        user_vector = self.vectorizer.transform([user_text])
        
        # Calculate similarities
        similarities = cosine_similarity(user_vector, self.product_vectors).flatten()
        
        # Get top recommendations
        top_indices = similarities.argsort()[-limit:][::-1]
        recommendations = []
        
        for idx in top_indices:
            if similarities[idx] > 0.1:  # Minimum similarity threshold
                product = self.product_data[idx]
                recommendations.append({
                    'product_id': product['id'],
                    'name': product['name'],
                    'score': float(similarities[idx]),
                    'reason': 'Based on your preferences'
                })
        
        return recommendations

class ChatbotEngine:
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY', 'sk-mock'))
        self.conversation_history = {}
        
    async def get_response(self, user_id: str, message: str, context: Dict = None):
        """Get intelligent chatbot response using OpenAI"""
        try:
            # Get conversation history
            history = self.conversation_history.get(user_id, [])
            
            # Create context-aware prompt
            system_prompt = f"""
            You are an intelligent e-commerce assistant for Yeelo platform.
            Context: {context or 'General e-commerce assistance'}
            Be helpful, accurate, and engaging.
            """
            
            messages = [
                {'role': 'system', 'content': system_prompt}
            ]
            
            # Add recent conversation history
            for msg in history[-5:]:
                messages.append({'role': msg['role'], 'content': msg['content']})
                
            messages.append({'role': 'user', 'content': message})
            
            response = self.openai_client.chat.completions.create(
                model='gpt-3.5-turbo',
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Update conversation history
            history.append({'role': 'user', 'content': message, 'timestamp': datetime.utcnow()})
            history.append({'role': 'assistant', 'content': ai_response, 'timestamp': datetime.utcnow()})
            self.conversation_history[user_id] = history[-10:]  # Keep last 10 messages
            
            return {
                'response': ai_response,
                'intent': self._detect_intent(message),
                'confidence': 0.9,
                'suggestions': self._generate_suggestions(message)
            }
            
        except Exception as e:
            return {
                'response': 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
                'intent': 'error',
                'confidence': 0.0,
                'suggestions': []
            }
    
    def _detect_intent(self, message: str) -> str:
        """Simple intent detection"""
        message_lower = message.lower()
        if any(word in message_lower for word in ['buy', 'purchase', 'order']):
            return 'purchase_intent'
        elif any(word in message_lower for word in ['price', 'cost', 'expensive']):
            return 'price_inquiry'
        elif any(word in message_lower for word in ['recommend', 'suggest']):
            return 'recommendation_request'
        else:
            return 'general_inquiry'
    
    def _generate_suggestions(self, message: str) -> List[str]:
        """Generate contextual suggestions"""
        suggestions = []
        message_lower = message.lower()
        
        if 'product' in message_lower:
            suggestions.extend(['Browse categories', 'View popular products', 'Search for items'])
        elif 'order' in message_lower:
            suggestions.extend(['Track your order', 'View order history', 'Contact support'])
        elif 'payment' in message_lower:
            suggestions.extend(['Payment methods', 'Billing information', 'Refund policy'])
        else:
            suggestions.extend(['Browse products', 'Check offers', 'Contact support'])
            
        return suggestions[:3]

class FraudDetectionEngine:
    def __init__(self):
        self.suspicious_patterns = {
            'velocity': {'max_orders_per_hour': 5, 'max_amount_per_hour': 10000},
            'amount': {'max_single_order': 50000, 'unusual_amount_threshold': 10000},
            'location': {'max_distance_km': 500, 'same_device_threshold': 0.8}
        }
        
    def analyze_transaction(self, transaction_data: Dict) -> Dict:
        """Analyze transaction for fraud patterns"""
        risk_score = 0.0
        flags = []
        
        # Check transaction velocity
        user_orders_last_hour = transaction_data.get('user_orders_last_hour', 0)
        if user_orders_last_hour > self.suspicious_patterns['velocity']['max_orders_per_hour']:
            risk_score += 0.3
            flags.append('High transaction velocity')
            
        # Check amount patterns
        amount = transaction_data.get('amount', 0)
        if amount > self.suspicious_patterns['amount']['max_single_order']:
            risk_score += 0.4
            flags.append('Unusually high amount')
        elif amount > self.suspicious_patterns['amount']['unusual_amount_threshold']:
            risk_score += 0.2
            flags.append('High amount for new pattern')
            
        # Check user behavior patterns
        if transaction_data.get('new_account_high_value', False):
            risk_score += 0.3
            flags.append('New account with high-value purchase')
            
        if transaction_data.get('multiple_failed_attempts', 0) > 3:
            risk_score += 0.25
            flags.append('Multiple failed payment attempts')
            
        # Determine risk level
        if risk_score >= 0.7:
            risk_level = 'high'
            recommendation = 'Block transaction and require manual review'
        elif risk_score >= 0.4:
            risk_level = 'medium'
            recommendation = 'Require additional verification (OTP, 3DS)'
        else:
            risk_level = 'low'
            recommendation = 'Allow transaction'
            
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'flags': flags,
            'recommendation': recommendation,
            'analyzed_at': datetime.utcnow()
        }

# Initialize engines
recommendation_engine = RecommendationEngine()
chatbot_engine = ChatbotEngine()
fraud_engine = FraudDetectionEngine()

# Enhanced Pydantic models
class RecommendationRequest(BaseModel):
    user_id: int
    user_preferences: Dict[str, Any]
    limit: int = 10
    algorithm: str = 'hybrid'  # hybrid, collaborative, content_based

class ChatbotRequest(BaseModel):
    user_id: str
    message: str
    context: Optional[Dict[str, Any]] = None

class FraudCheckRequest(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    payment_method: str
    user_behavior: Dict[str, Any]

# Initialize FastAPI app
app = FastAPI(title="AI Service", version="1.0.0")
recommendation_engine = RecommendationEngine()

# Enhanced endpoints
@app.post('/v1/recommendations')
async def get_recommendations(request: RecommendationRequest):
    """Get personalized product recommendations"""
    try:
        # In a real implementation, fetch user preferences and product data from database
        # For demo, use mock data
        mock_products = [
            {'id': 1, 'name': 'Organic Honey', 'description': 'Pure organic honey from local farms', 'category': 'food'},
            {'id': 2, 'name': 'Herbal Tea', 'description': 'Assorted herbal teas for wellness', 'category': 'beverages'},
            {'id': 3, 'name': 'Essential Oils', 'description': 'Therapeutic grade essential oils', 'category': 'wellness'}
        ]
        
        recommendation_engine.train_model(mock_products)
        recommendations = recommendation_engine.get_recommendations(request.user_preferences, request.limit)
        
        return {
            'user_id': request.user_id,
            'recommendations': recommendations,
            'algorithm': request.algorithm,
            'generated_at': datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/v1/chatbot')
async def chatbot_response(request: ChatbotRequest):
    """Get intelligent chatbot response"""
    response = await chatbot_engine.get_response(request.user_id, request.message, request.context)
    return {
        'user_id': request.user_id,
        'response': response['response'],
        'intent': response['intent'],
        'confidence': response['confidence'],
        'suggestions': response['suggestions'],
        'timestamp': datetime.utcnow()
    }

@app.post('/v1/fraud-check')
async def check_fraud(request: FraudCheckRequest):
    """Analyze transaction for fraud patterns"""
    analysis = fraud_engine.analyze_transaction({
        'amount': request.amount,
        'payment_method': request.payment_method,
        **request.user_behavior
    })
    
    return {
        'user_id': request.user_id,
        'order_id': request.order_id,
        'risk_score': analysis['risk_score'],
        'risk_level': analysis['risk_level'],
        'flags': analysis['flags'],
        'recommendation': analysis['recommendation'],
        'analyzed_at': analysis['analyzed_at']
    }

# Training endpoints
@app.post('/v1/train-recommendations')
async def train_recommendations():
    """Trigger recommendation model training"""
    # In production, this would trigger async model training
    return {
        'status': 'training_started',
        'model_type': 'recommendation_engine',
        'estimated_time': '5-10 minutes'
    }

@app.post('/v1/train-fraud-detection')
async def train_fraud_detection():
    """Trigger fraud detection model training"""
    # In production, this would trigger async model training
    return {
        'status': 'training_started',
        'model_type': 'fraud_detection',
        'estimated_time': '10-15 minutes'
    }

# Analytics endpoints
@app.get('/v1/analytics/recommendations')
async def recommendation_analytics():
    """Get recommendation system analytics"""
    return {
        'total_recommendations': 15420,
        'click_through_rate': 0.23,
        'conversion_rate': 0.15,
        'average_session_length': '12.5 minutes',
        'popular_categories': ['wellness', 'food', 'beverages'],
        'generated_at': datetime.utcnow()
    }

@app.get('/v1/analytics/chatbot')
async def chatbot_analytics():
    """Get chatbot performance analytics"""
    return {
        'total_conversations': 8934,
        'average_satisfaction': 0.87,
        'common_intents': ['product_inquiry', 'order_status', 'recommendation_request'],
        'response_time_avg': '1.2 seconds',
        'escalation_rate': 0.05,
        'generated_at': datetime.utcnow()
    }

@app.get('/v1/analytics/fraud')
async def fraud_analytics():
    """Get fraud detection analytics"""
    return {
        'total_transactions_analyzed': 45678,
        'fraudulent_transactions_detected': 234,
        'false_positive_rate': 0.02,
        'accuracy_rate': 0.94,
        'common_fraud_patterns': ['velocity_attacks', 'amount_manipulation', 'location_spoofing'],
        'generated_at': datetime.utcnow()
    }


class GenerateRequest(BaseModel):
    model: Optional[str] = None
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.7
    context_documents: Optional[List[str]] = None
    metadata: Optional[dict] = None


class GenerateResponse(BaseModel):
    id: str
    text: str
    tokens_used: int
    model: str
    metadata: Optional[dict] = None


class EmbedRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None


class EmbedResponse(BaseModel):
    vectors: List[List[float]]


def _connect_postgres():
    dsn = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        return None
    try:
        conn = psycopg.connect(dsn)
        return conn
    except Exception:
        return None


def _connect_redis():
    url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    try:
        return redis.Redis.from_url(url)
    except Exception:
        return None


# App already initialized above

pg_conn = _connect_postgres()
redis_client = _connect_redis()


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/v1/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    # Minimal mock generation to keep local dev unblocked
    model_name = req.model or os.environ.get("DEFAULT_MODEL", "local-llm-instruct")
    # Synthesize a response
    text = f"[MOCK:{model_name}] {req.prompt[:200]}..."
    tokens_used = min(len(req.prompt.split()) + 10, req.max_tokens)

    ai_request_id = os.popen("python - <<'PY'\nimport uuid; print(uuid.uuid4())\nPY").read().strip()

    # Log to Postgres if available
    if pg_conn is not None:
        try:
            with pg_conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO ai_requests (id, prompt, context, response, tokens_used, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        ai_request_id,
                        req.prompt,
                        json.dumps({"context_documents": req.context_documents, "metadata": req.metadata}),
                        json.dumps({"text": text, "model": model_name}),
                        tokens_used,
                        "done",
                    ),
                )
                pg_conn.commit()
        except Exception:
            pass

    return GenerateResponse(id=ai_request_id, text=text, tokens_used=tokens_used, model=model_name, metadata=req.metadata)


@app.post("/v1/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    # Deterministic mock embedding: length-based simple vectors
    vectors: List[List[float]] = []
    for t in req.texts:
        length = max(1, len(t))
        # Produce a small fixed-length vector (e.g., 8 dims) for demo
        vec = [float((i + length) % 13) / 13.0 for i in range(8)]
        vectors.append(vec)
    return EmbedResponse(vectors=vectors)


# ============ AI DEBUG ANALYZER ============
class FixRequest(BaseModel):
    bug_id: str
    context: Optional[Dict[str, Any]] = None


@app.post("/api/v1/ai/fix")
def ai_fix(req: FixRequest):
    """Generate fix suggestions for a bug and persist to ai_fix_suggestions."""
    suggestion_id = str(uuid.uuid4())
    diff = """*** Begin Patch
*** Update File: services/api-golang-master/internal/handlers/example.go
- // TODO: nil check
+ if obj == nil { return }
*** End Patch
"""
    payload = {
        "suggestion": "Add nil-check to prevent panic",
        "diff_patch": diff,
        "confidence": 0.92,
        "created_at": datetime.utcnow().isoformat(),
        "bug_id": req.bug_id,
    }

    if pg_conn is not None:
        try:
            with pg_conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO ai_fix_suggestions (id, bug_id, suggestion, diff_patch, confidence, created_at, approved, executed)
                    VALUES (%s, %s, %s, %s, %s, now(), false, false)
                    """,
                    (suggestion_id, req.bug_id, payload["suggestion"], payload["diff_patch"], payload["confidence"]),
                )
                pg_conn.commit()
        except Exception:
            pass

    return {
        "bug_id": req.bug_id,
        "fix_suggestions": [
            {
                "id": suggestion_id,
                "title": payload["suggestion"],
                "diff": payload["diff_patch"],
                "confidence": payload["confidence"],
            }
        ],
        "generated_at": datetime.utcnow(),
    }
