"""
Dynamic Pricing Service
Handles AI-powered pricing optimization
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np

from .database import DatabaseManager

logger = logging.getLogger(__name__)

class DynamicPricingService:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        
    async def initialize(self):
        """Initialize pricing service"""
        try:
            logger.info("Dynamic pricing service initialized")
        except Exception as e:
            logger.error(f"Error initializing pricing service: {str(e)}")
            raise
    
    async def calculate_optimal_pricing(
        self,
        product_id: str,
        current_price: float,
        current_stock: int,
        expiry_date: Optional[datetime] = None,
        demand_forecast: int = 0,
        competitor_prices: Optional[List[float]] = None,
        cost_price: float = 0
    ) -> Dict[str, Any]:
        """Calculate optimal pricing using AI"""
        try:
            # Calculate various pricing factors
            expiry_factor = self.calculate_expiry_discount(expiry_date)
            stock_factor = self.calculate_stock_adjustment(current_stock, demand_forecast)
            competitive_factor = self.calculate_competitive_adjustment(competitor_prices, current_price)
            margin_factor = self.calculate_margin_factor(current_price, cost_price)
            
            # Combine factors to get recommended price
            base_price = current_price
            recommended_price = base_price * expiry_factor * stock_factor * competitive_factor
            
            # Ensure price is within reasonable bounds
            min_price = cost_price * 1.1  # 10% margin minimum
            max_price = current_price * 1.5  # 50% increase maximum
            recommended_price = max(min_price, min(recommended_price, max_price))
            
            # Calculate confidence and reasoning
            confidence = self.calculate_confidence(
                expiry_factor, stock_factor, competitive_factor, margin_factor
            )
            
            reasoning = self.generate_reasoning(
                expiry_factor, stock_factor, competitive_factor, margin_factor,
                current_price, recommended_price
            )
            
            # Calculate expected impact
            expected_impact = self.calculate_expected_impact(
                current_price, recommended_price, demand_forecast
            )
            
            return {
                "product_id": product_id,
                "current_price": current_price,
                "recommended_price": round(recommended_price, 2),
                "confidence_score": confidence,
                "reasoning": reasoning,
                "expected_impact": expected_impact,
                "factors": {
                    "expiry_discount": expiry_factor,
                    "stock_adjustment": stock_factor,
                    "competitive_adjustment": competitive_factor,
                    "margin_factor": margin_factor
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating optimal pricing: {str(e)}")
            raise
    
    def calculate_expiry_discount(self, expiry_date: Optional[datetime]) -> float:
        """Calculate discount factor based on expiry date"""
        if not expiry_date:
            return 1.0
        
        days_to_expiry = (expiry_date - datetime.utcnow()).days
        
        if days_to_expiry <= 7:
            return 0.6  # 40% discount for expiring soon
        elif days_to_expiry <= 30:
            return 0.8  # 20% discount for expiring within a month
        elif days_to_expiry <= 60:
            return 0.9  # 10% discount for expiring within 2 months
        else:
            return 1.0  # No discount
    
    def calculate_stock_adjustment(self, current_stock: int, demand_forecast: int) -> float:
        """Calculate price adjustment based on stock levels"""
        if demand_forecast == 0:
            demand_forecast = 10  # Default demand
        
        stock_ratio = current_stock / demand_forecast
        
        if stock_ratio > 3:
            return 0.85  # 15% discount for overstock
        elif stock_ratio > 2:
            return 0.9   # 10% discount for high stock
        elif stock_ratio < 0.5:
            return 1.1   # 10% premium for low stock
        elif stock_ratio < 0.3:
            return 1.15  # 15% premium for very low stock
        else:
            return 1.0   # No adjustment
    
    def calculate_competitive_adjustment(
        self, 
        competitor_prices: Optional[List[float]], 
        current_price: float
    ) -> float:
        """Calculate price adjustment based on competitor prices"""
        if not competitor_prices or len(competitor_prices) == 0:
            return 1.0
        
        avg_competitor_price = np.mean(competitor_prices)
        price_ratio = current_price / avg_competitor_price
        
        if price_ratio > 1.3:
            return 0.9   # 10% discount if significantly higher than competitors
        elif price_ratio > 1.1:
            return 0.95  # 5% discount if moderately higher
        elif price_ratio < 0.7:
            return 1.1   # 10% premium if significantly lower
        elif price_ratio < 0.9:
            return 1.05  # 5% premium if moderately lower
        else:
            return 1.0   # No adjustment
    
    def calculate_margin_factor(self, current_price: float, cost_price: float) -> float:
        """Calculate margin-based adjustment"""
        if cost_price <= 0:
            return 1.0
        
        margin = (current_price - cost_price) / cost_price
        
        if margin < 0.1:  # Less than 10% margin
            return 1.1   # Increase price
        elif margin > 0.5:  # More than 50% margin
            return 0.95  # Slight decrease
        else:
            return 1.0   # No adjustment
    
    def calculate_confidence(
        self, 
        expiry_factor: float, 
        stock_factor: float, 
        competitive_factor: float, 
        margin_factor: float
    ) -> float:
        """Calculate confidence score for pricing recommendation"""
        # Higher confidence when factors are more extreme (clear signals)
        factor_variance = np.var([expiry_factor, stock_factor, competitive_factor, margin_factor])
        base_confidence = 0.7
        
        # Increase confidence based on factor variance
        confidence = base_confidence + min(0.25, factor_variance * 2)
        
        return min(0.95, max(0.3, confidence))
    
    def generate_reasoning(
        self,
        expiry_factor: float,
        stock_factor: float,
        competitive_factor: float,
        margin_factor: float,
        current_price: float,
        recommended_price: float
    ) -> str:
        """Generate human-readable reasoning for pricing recommendation"""
        reasons = []
        
        if expiry_factor < 1.0:
            discount_pct = int((1 - expiry_factor) * 100)
            reasons.append(f"Product is expiring soon - {discount_pct}% discount recommended")
        
        if stock_factor < 1.0:
            discount_pct = int((1 - stock_factor) * 100)
            reasons.append(f"High stock levels - {discount_pct}% discount to increase sales")
        elif stock_factor > 1.0:
            premium_pct = int((stock_factor - 1) * 100)
            reasons.append(f"Low stock levels - {premium_pct}% premium to manage demand")
        
        if competitive_factor < 1.0:
            discount_pct = int((1 - competitive_factor) * 100)
            reasons.append(f"Price is higher than competitors - {discount_pct}% discount to stay competitive")
        elif competitive_factor > 1.0:
            premium_pct = int((competitive_factor - 1) * 100)
            reasons.append(f"Price is lower than competitors - {premium_pct}% premium opportunity")
        
        if margin_factor > 1.0:
            reasons.append("Low margin detected - price increase recommended")
        elif margin_factor < 1.0:
            reasons.append("High margin - slight price reduction to increase competitiveness")
        
        if not reasons:
            reasons.append("Current pricing appears optimal based on available factors")
        
        return "; ".join(reasons)
    
    def calculate_expected_impact(
        self, 
        current_price: float, 
        recommended_price: float, 
        demand_forecast: int
    ) -> Dict[str, float]:
        """Calculate expected impact of price change"""
        price_change_pct = (recommended_price - current_price) / current_price
        
        # Estimate demand elasticity (simplified model)
        elasticity = -1.5  # Typical price elasticity for retail products
        demand_change_pct = elasticity * price_change_pct
        
        # Calculate expected sales change
        expected_demand = demand_forecast * (1 + demand_change_pct)
        expected_revenue = expected_demand * recommended_price
        current_revenue = demand_forecast * current_price
        
        revenue_change = expected_revenue - current_revenue
        revenue_change_pct = revenue_change / current_revenue if current_revenue > 0 else 0
        
        return {
            "sales_change": demand_change_pct,
            "revenue_change": revenue_change_pct,
            "expected_demand": max(0, expected_demand),
            "expected_revenue": expected_revenue
        }
