"""
Customer Agent for AI-powered customer management
Handles customer segmentation, behavior analysis, and engagement automation
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np

from ..ai_models import AIModelManager
from ..database import DatabaseManager

logger = logging.getLogger(__name__)

class CustomerAgent:
    def __init__(self, ai_models: AIModelManager, db_manager: DatabaseManager):
        self.ai_models = ai_models
        self.db_manager = db_manager
        
    async def analyze_customer_segments(self, shop_id: str) -> Dict[str, Any]:
        """Analyze and segment customers using AI"""
        try:
            # Get customer data
            customers = await self.db_manager.get_customers_with_behavior(shop_id)
            
            if not customers:
                return {"success": False, "error": "No customer data found"}
            
            # Prepare features for clustering
            features = await self._prepare_customer_features(customers)
            
            # Perform customer segmentation
            segments = await self._perform_customer_segmentation(features)
            
            # Analyze each segment
            segment_analysis = await self._analyze_customer_segments(segments, customers)
            
            # Generate engagement strategies
            engagement_strategies = await self._generate_engagement_strategies(segment_analysis)
            
            return {
                "success": True,
                "segments": segment_analysis,
                "engagement_strategies": engagement_strategies,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing customer segments: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _prepare_customer_features(self, customers: List[Dict]) -> np.ndarray:
        """Prepare customer features for ML analysis"""
        features = []
        
        for customer in customers:
            # Calculate customer metrics
            total_orders = customer.get('total_orders', 0)
            total_spent = customer.get('total_spent', 0)
            avg_order_value = customer.get('avg_order_value', 0)
            days_since_last_order = customer.get('days_since_last_order', 365)
            order_frequency = customer.get('order_frequency', 0)
            
            # Create feature vector
            feature_vector = [
                total_orders,
                total_spent,
                avg_order_value,
                days_since_last_order,
                order_frequency,
                customer.get('loyalty_points', 0),
                customer.get('referral_count', 0)
            ]
            
            features.append(feature_vector)
        
        return np.array(features)
    
    async def _perform_customer_segmentation(self, features: np.ndarray) -> Dict[str, Any]:
        """Perform customer segmentation using K-means"""
        # Normalize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Determine optimal number of clusters
        optimal_clusters = await self._find_optimal_clusters(features_scaled)
        
        # Perform K-means clustering
        kmeans = KMeans(n_clusters=optimal_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(features_scaled)
        
        # Calculate cluster centers
        cluster_centers = kmeans.cluster_centers_
        
        return {
            "labels": cluster_labels.tolist(),
            "centers": cluster_centers.tolist(),
            "n_clusters": optimal_clusters
        }
    
    async def _find_optimal_clusters(self, features: np.ndarray) -> int:
        """Find optimal number of clusters using elbow method"""
        from sklearn.metrics import silhouette_score
        
        max_clusters = min(8, len(features) // 2)  # Reasonable upper limit
        silhouette_scores = []
        
        for k in range(2, max_clusters + 1):
            kmeans = KMeans(n_clusters=k, random_state=42)
            cluster_labels = kmeans.fit_predict(features)
            score = silhouette_score(features, cluster_labels)
            silhouette_scores.append(score)
        
        # Find k with highest silhouette score
        optimal_k = np.argmax(silhouette_scores) + 2
        return optimal_k
    
    async def _analyze_customer_segments(self, segments: Dict, customers: List[Dict]) -> Dict[str, Any]:
        """Analyze each customer segment"""
        segment_analysis = {}
        
        for i in range(segments['n_clusters']):
            segment_customers = [customers[j] for j, label in enumerate(segments['labels']) if label == i]
            
            if not segment_customers:
                continue
            
            # Calculate segment metrics
            total_customers = len(segment_customers)
            total_revenue = sum(c.get('total_spent', 0) for c in segment_customers)
            avg_order_value = sum(c.get('avg_order_value', 0) for c in segment_customers) / total_customers
            avg_frequency = sum(c.get('order_frequency', 0) for c in segment_customers) / total_customers
            
            # Generate segment description using AI
            segment_description = await self._generate_segment_description(segment_customers)
            
            segment_analysis[f"segment_{i}"] = {
                "name": f"Segment {i+1}",
                "customer_count": total_customers,
                "total_revenue": total_revenue,
                "avg_order_value": avg_order_value,
                "avg_frequency": avg_frequency,
                "description": segment_description,
                "characteristics": await self._identify_segment_characteristics(segment_customers)
            }
        
        return segment_analysis
    
    async def _generate_segment_description(self, customers: List[Dict]) -> str:
        """Generate AI description of customer segment"""
        # Calculate key metrics
        avg_spent = sum(c.get('total_spent', 0) for c in customers) / len(customers)
        avg_orders = sum(c.get('total_orders', 0) for c in customers) / len(customers)
        avg_frequency = sum(c.get('order_frequency', 0) for c in customers) / len(customers)
        
        prompt = f"""
        Analyze this customer segment and provide a description:
        
        Segment Metrics:
        - Average total spent: ₹{avg_spent:.2f}
        - Average number of orders: {avg_orders:.1f}
        - Average order frequency: {avg_frequency:.2f} orders/month
        - Customer count: {len(customers)}
        
        Provide a 2-3 sentence description of this customer segment, including:
        1. Their spending behavior
        2. Their loyalty level
        3. Recommended engagement strategy
        
        Be specific and actionable.
        """
        
        response = await self.ai_models.generate_content(
            prompt=prompt,
            model="gpt-4",
            max_tokens=200,
            temperature=0.7
        )
        
        return response["text"]
    
    async def _identify_segment_characteristics(self, customers: List[Dict]) -> List[str]:
        """Identify key characteristics of customer segment"""
        characteristics = []
        
        # Analyze spending patterns
        high_spenders = [c for c in customers if c.get('total_spent', 0) > 1000]
        if len(high_spenders) > len(customers) * 0.7:
            characteristics.append("High-value customers")
        
        # Analyze frequency
        frequent_buyers = [c for c in customers if c.get('order_frequency', 0) > 2]
        if len(frequent_buyers) > len(customers) * 0.6:
            characteristics.append("Frequent buyers")
        
        # Analyze recency
        recent_customers = [c for c in customers if c.get('days_since_last_order', 365) < 30]
        if len(recent_customers) > len(customers) * 0.8:
            characteristics.append("Active customers")
        else:
            characteristics.append("At-risk customers")
        
        # Analyze loyalty
        loyal_customers = [c for c in customers if c.get('loyalty_points', 0) > 100]
        if len(loyal_customers) > len(customers) * 0.5:
            characteristics.append("Loyal customers")
        
        return characteristics
    
    async def _generate_engagement_strategies(self, segment_analysis: Dict) -> Dict[str, Any]:
        """Generate engagement strategies for each segment"""
        strategies = {}
        
        for segment_name, segment_data in segment_analysis.items():
            characteristics = segment_data.get('characteristics', [])
            
            # Generate AI-powered engagement strategy
            prompt = f"""
            Create an engagement strategy for this customer segment:
            
            Segment: {segment_data.get('name', '')}
            Customer Count: {segment_data.get('customer_count', 0)}
            Total Revenue: ₹{segment_data.get('total_revenue', 0):.2f}
            Avg Order Value: ₹{segment_data.get('avg_order_value', 0):.2f}
            Characteristics: {', '.join(characteristics)}
            
            Provide specific engagement strategies including:
            1. Communication frequency
            2. Content type preferences
            3. Promotional offers
            4. Channel preferences
            5. Personalization tactics
            
            Format as JSON with actionable recommendations.
            """
            
            response = await self.ai_models.generate_content(
                prompt=prompt,
                model="gpt-4",
                max_tokens=400,
                temperature=0.7
            )
            
            strategies[segment_name] = json.loads(response["text"])
        
        return strategies
    
    async def predict_customer_churn(self, shop_id: str) -> Dict[str, Any]:
        """Predict customer churn risk"""
        try:
            # Get customer data
            customers = await self.db_manager.get_customers_with_behavior(shop_id)
            
            churn_predictions = []
            
            for customer in customers:
                # Calculate churn risk factors
                days_since_last_order = customer.get('days_since_last_order', 365)
                order_frequency = customer.get('order_frequency', 0)
                total_orders = customer.get('total_orders', 0)
                
                # Simple churn risk calculation
                churn_risk = 0
                if days_since_last_order > 90:
                    churn_risk += 0.4
                if order_frequency < 0.5:
                    churn_risk += 0.3
                if total_orders < 2:
                    churn_risk += 0.3
                
                churn_predictions.append({
                    "customer_id": customer.get('id'),
                    "customer_name": customer.get('name'),
                    "churn_risk": min(churn_risk, 1.0),
                    "risk_factors": await self._identify_churn_factors(customer),
                    "recommended_actions": await self._recommend_retention_actions(customer, churn_risk)
                })
            
            # Sort by churn risk
            churn_predictions.sort(key=lambda x: x['churn_risk'], reverse=True)
            
            return {
                "success": True,
                "churn_predictions": churn_predictions,
                "high_risk_count": len([p for p in churn_predictions if p['churn_risk'] > 0.7]),
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error predicting customer churn: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _identify_churn_factors(self, customer: Dict) -> List[str]:
        """Identify specific churn risk factors for a customer"""
        factors = []
        
        days_since_last_order = customer.get('days_since_last_order', 365)
        if days_since_last_order > 60:
            factors.append(f"Last order {days_since_last_order} days ago")
        
        order_frequency = customer.get('order_frequency', 0)
        if order_frequency < 1:
            factors.append("Low order frequency")
        
        total_orders = customer.get('total_orders', 0)
        if total_orders < 3:
            factors.append("Few total orders")
        
        return factors
    
    async def _recommend_retention_actions(self, customer: Dict, churn_risk: float) -> List[str]:
        """Recommend retention actions based on churn risk"""
        actions = []
        
        if churn_risk > 0.8:
            actions.extend([
                "Send personalized re-engagement email",
                "Offer exclusive discount",
                "Schedule follow-up call"
            ])
        elif churn_risk > 0.5:
            actions.extend([
                "Send product recommendations",
                "Share health tips and content",
                "Invite to loyalty program"
            ])
        else:
            actions.extend([
                "Regular newsletter",
                "Seasonal promotions",
                "Referral program invitation"
            ])
        
        return actions
    
    async def generate_personalized_recommendations(self, customer_id: str) -> Dict[str, Any]:
        """Generate personalized product recommendations"""
        try:
            # Get customer data
            customer = await self.db_manager.get_customer_with_history(customer_id)
            
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            # Get purchase history
            purchase_history = customer.get('purchase_history', [])
            
            # Generate AI recommendations
            prompt = f"""
            Generate personalized product recommendations for a homeopathy customer:
            
            Customer: {customer.get('name', '')}
            Purchase History: {[p.get('product_name', '') for p in purchase_history[:5]]}
            Health Conditions: {customer.get('health_conditions', [])}
            Preferences: {customer.get('preferences', [])}
            
            Recommend 3-5 homeopathic products based on:
            1. Purchase history patterns
            2. Common health conditions
            3. Seasonal relevance
            4. Complementary products
            
            Format as JSON with product recommendations and reasoning.
            """
            
            response = await self.ai_models.generate_content(
                prompt=prompt,
                model="gpt-4",
                max_tokens=400,
                temperature=0.7
            )
            
            recommendations = json.loads(response["text"])
            
            return {
                "success": True,
                "customer_id": customer_id,
                "recommendations": recommendations,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating personalized recommendations: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def analyze_customer_lifetime_value(self, shop_id: str) -> Dict[str, Any]:
        """Analyze customer lifetime value patterns"""
        try:
            # Get customer data
            customers = await self.db_manager.get_customers_with_behavior(shop_id)
            
            if not customers:
                return {"success": False, "error": "No customer data found"}
            
            # Calculate CLV metrics
            clv_analysis = {
                "total_customers": len(customers),
                "total_revenue": sum(c.get('total_spent', 0) for c in customers),
                "avg_clv": sum(c.get('total_spent', 0) for c in customers) / len(customers),
                "high_value_customers": len([c for c in customers if c.get('total_spent', 0) > 1000]),
                "clv_distribution": await self._analyze_clv_distribution(customers)
            }
            
            # Generate insights
            insights = await self._generate_clv_insights(clv_analysis)
            
            return {
                "success": True,
                "clv_analysis": clv_analysis,
                "insights": insights,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing customer lifetime value: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _analyze_clv_distribution(self, customers: List[Dict]) -> Dict[str, int]:
        """Analyze CLV distribution across customer segments"""
        distribution = {
            "high_value": 0,    # > ₹2000
            "medium_value": 0,  # ₹500-2000
            "low_value": 0      # < ₹500
        }
        
        for customer in customers:
            total_spent = customer.get('total_spent', 0)
            if total_spent > 2000:
                distribution["high_value"] += 1
            elif total_spent > 500:
                distribution["medium_value"] += 1
            else:
                distribution["low_value"] += 1
        
        return distribution
    
    async def _generate_clv_insights(self, clv_analysis: Dict) -> List[str]:
        """Generate insights from CLV analysis"""
        insights = []
        
        total_customers = clv_analysis['total_customers']
        high_value_count = clv_analysis['high_value_customers']
        avg_clv = clv_analysis['avg_clv']
        
        if high_value_count / total_customers > 0.2:
            insights.append(f"Strong high-value customer base: {high_value_count} customers ({(high_value_count/total_customers)*100:.1f}%)")
        
        if avg_clv > 1000:
            insights.append(f"High average CLV: ₹{avg_clv:.2f} - focus on retention")
        else:
            insights.append(f"Opportunity to increase CLV: current average ₹{avg_clv:.2f}")
        
        distribution = clv_analysis['clv_distribution']
        if distribution['low_value'] > total_customers * 0.5:
            insights.append("High proportion of low-value customers - implement upselling strategies")
        
        return insights
