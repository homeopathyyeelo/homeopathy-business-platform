"""
Demand Forecasting Service
Handles AI-powered demand prediction for inventory management
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

from .database import DatabaseManager

logger = logging.getLogger(__name__)

class DemandForecastingService:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.models = {}
        self.scalers = {}
        
    async def initialize(self):
        """Initialize forecasting service"""
        try:
            logger.info("Demand forecasting service initialized")
        except Exception as e:
            logger.error(f"Error initializing forecasting service: {str(e)}")
            raise
    
    async def forecast_demand(
        self,
        product_id: str,
        shop_id: str,
        days_ahead: int = 30,
        include_seasonality: bool = True
    ) -> Dict[str, Any]:
        """Forecast demand for a product"""
        try:
            # Get historical data
            historical_data = await self.get_historical_sales_data(
                product_id, shop_id, days_back=180
            )
            
            if not historical_data:
                # Return default forecast if no historical data
                return await self.get_default_forecast(product_id, shop_id, days_ahead)
            
            # Prepare features
            features = await self.prepare_features(
                historical_data, include_seasonality
            )
            
            # Train model if not exists
            model_key = f"{product_id}_{shop_id}"
            if model_key not in self.models:
                await self.train_model(model_key, features)
            
            # Make prediction
            forecast = await self.predict_demand(
                model_key, features, days_ahead
            )
            
            # Generate recommendations
            recommendations = await self.generate_recommendations(
                forecast, product_id, shop_id
            )
            
            return {
                "product_id": product_id,
                "shop_id": shop_id,
                "forecasted_quantity": forecast["quantity"],
                "confidence_score": forecast["confidence"],
                "forecast_date": datetime.utcnow() + timedelta(days=days_ahead),
                "factors": forecast["factors"],
                "recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Error forecasting demand: {str(e)}")
            raise
    
    async def get_historical_sales_data(
        self, 
        product_id: str, 
        shop_id: str, 
        days_back: int
    ) -> List[Dict[str, Any]]:
        """Get historical sales data for forecasting"""
        try:
            # In a real implementation, you would query the database
            # For now, return mock data
            mock_data = []
            base_date = datetime.utcnow() - timedelta(days=days_back)
            
            for i in range(days_back):
                date = base_date + timedelta(days=i)
                # Generate mock sales data with some seasonality
                base_sales = 10
                seasonality = 5 * np.sin(2 * np.pi * i / 30)  # Monthly seasonality
                trend = 0.1 * i  # Slight upward trend
                noise = np.random.normal(0, 2)
                
                sales = max(0, int(base_sales + seasonality + trend + noise))
                
                mock_data.append({
                    "date": date,
                    "quantity": sales,
                    "price": 100.0 + np.random.normal(0, 10)
                })
            
            return mock_data
            
        except Exception as e:
            logger.error(f"Error getting historical sales data: {str(e)}")
            return []
    
    async def prepare_features(
        self, 
        historical_data: List[Dict[str, Any]], 
        include_seasonality: bool
    ) -> Dict[str, Any]:
        """Prepare features for forecasting model"""
        try:
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            features = {
                "quantities": df['quantity'].values,
                "dates": df['date'].values,
                "prices": df['price'].values
            }
            
            if include_seasonality:
                # Add seasonal features
                df['day_of_week'] = df['date'].dt.dayofweek
                df['month'] = df['date'].dt.month
                df['day_of_year'] = df['date'].dt.dayofyear
                
                features.update({
                    "day_of_week": df['day_of_week'].values,
                    "month": df['month'].values,
                    "day_of_year": df['day_of_year'].values
                })
            
            return features
            
        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            raise
    
    async def train_model(self, model_key: str, features: Dict[str, Any]):
        """Train forecasting model"""
        try:
            quantities = features["quantities"]
            
            # Simple linear regression model
            model = LinearRegression()
            scaler = StandardScaler()
            
            # Prepare training data
            X = np.arange(len(quantities)).reshape(-1, 1)
            y = quantities
            
            # Scale features
            X_scaled = scaler.fit_transform(X)
            
            # Train model
            model.fit(X_scaled, y)
            
            # Store model and scaler
            self.models[model_key] = model
            self.scalers[model_key] = scaler
            
            logger.info(f"Trained forecasting model for {model_key}")
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    async def predict_demand(
        self, 
        model_key: str, 
        features: Dict[str, Any], 
        days_ahead: int
    ) -> Dict[str, Any]:
        """Make demand prediction"""
        try:
            if model_key not in self.models:
                raise ValueError(f"Model {model_key} not found")
            
            model = self.models[model_key]
            scaler = self.scalers[model_key]
            
            # Get last data point
            last_quantity = features["quantities"][-1]
            last_index = len(features["quantities"]) - 1
            
            # Predict for future days
            future_indices = np.arange(last_index + 1, last_index + days_ahead + 1).reshape(-1, 1)
            future_scaled = scaler.transform(future_indices)
            
            predictions = model.predict(future_scaled)
            
            # Calculate average predicted quantity
            avg_quantity = np.mean(predictions)
            confidence = min(0.95, max(0.5, 1.0 - np.std(predictions) / (avg_quantity + 1)))
            
            # Calculate factors
            factors = {
                "trend": float(model.coef_[0]) if hasattr(model, 'coef_') else 0.0,
                "seasonality": 0.1,  # Mock seasonality factor
                "external_events": 0.0
            }
            
            return {
                "quantity": max(0, int(avg_quantity)),
                "confidence": confidence,
                "factors": factors,
                "predictions": predictions.tolist()
            }
            
        except Exception as e:
            logger.error(f"Error predicting demand: {str(e)}")
            raise
    
    async def generate_recommendations(
        self, 
        forecast: Dict[str, Any], 
        product_id: str, 
        shop_id: str
    ) -> List[str]:
        """Generate recommendations based on forecast"""
        try:
            recommendations = []
            quantity = forecast["quantity"]
            confidence = forecast["confidence"]
            
            # Get current stock (mock)
            current_stock = 50  # This would come from database
            
            if quantity > current_stock:
                recommendations.append(
                    f"Consider restocking - forecasted demand ({quantity}) exceeds current stock ({current_stock})"
                )
            
            if confidence < 0.7:
                recommendations.append(
                    "Low confidence forecast - consider manual review of inventory needs"
                )
            
            if quantity > current_stock * 2:
                recommendations.append(
                    "High demand forecast - consider increasing reorder point"
                )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    async def get_default_forecast(
        self, 
        product_id: str, 
        shop_id: str, 
        days_ahead: int
    ) -> Dict[str, Any]:
        """Get default forecast when no historical data is available"""
        try:
            # Return conservative default forecast
            return {
                "product_id": product_id,
                "shop_id": shop_id,
                "forecasted_quantity": 10,  # Conservative default
                "confidence_score": 0.3,  # Low confidence
                "forecast_date": datetime.utcnow() + timedelta(days=days_ahead),
                "factors": {
                    "trend": 0.0,
                    "seasonality": 0.0,
                    "external_events": 0.0
                },
                "recommendations": [
                    "No historical data available - using conservative forecast",
                    "Consider manual review of inventory needs"
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting default forecast: {str(e)}")
            raise
