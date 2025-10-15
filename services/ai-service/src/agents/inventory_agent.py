"""
Inventory Agent for AI-powered inventory management
Handles demand forecasting, reorder suggestions, and stock optimization
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

from ..ai_models import AIModelManager
from ..database import DatabaseManager
from ..forecasting import DemandForecastingService

logger = logging.getLogger(__name__)

class InventoryAgent:
    def __init__(self, ai_models: AIModelManager, db_manager: DatabaseManager, forecasting_service: DemandForecastingService):
        self.ai_models = ai_models
        self.db_manager = db_manager
        self.forecasting_service = forecasting_service
        
    async def analyze_inventory_health(self, shop_id: str) -> Dict[str, Any]:
        """Analyze overall inventory health and provide recommendations"""
        try:
            # Get inventory data
            inventory_data = await self.db_manager.get_inventory_data(shop_id)
            
            if not inventory_data:
                return {"success": False, "error": "No inventory data found"}
            
            # Analyze stock levels
            stock_analysis = await self._analyze_stock_levels(inventory_data)
            
            # Identify slow-moving items
            slow_moving = await self._identify_slow_moving_items(shop_id)
            
            # Identify fast-moving items
            fast_moving = await self._identify_fast_moving_items(shop_id)
            
            # Check for expiry risks
            expiry_risks = await self._check_expiry_risks(inventory_data)
            
            # Generate recommendations
            recommendations = await self._generate_inventory_recommendations(
                stock_analysis, slow_moving, fast_moving, expiry_risks
            )
            
            return {
                "success": True,
                "analysis": {
                    "stock_levels": stock_analysis,
                    "slow_moving_items": slow_moving,
                    "fast_moving_items": fast_moving,
                    "expiry_risks": expiry_risks,
                    "recommendations": recommendations
                },
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing inventory health: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _analyze_stock_levels(self, inventory_data: List[Dict]) -> Dict[str, Any]:
        """Analyze current stock levels"""
        total_products = len(inventory_data)
        low_stock = 0
        out_of_stock = 0
        overstocked = 0
        
        for item in inventory_data:
            current_stock = item.get('quantity', 0)
            reorder_level = item.get('reorder_level', 10)
            max_stock = item.get('max_stock', reorder_level * 3)
            
            if current_stock == 0:
                out_of_stock += 1
            elif current_stock <= reorder_level:
                low_stock += 1
            elif current_stock > max_stock:
                overstocked += 1
        
        return {
            "total_products": total_products,
            "low_stock_count": low_stock,
            "out_of_stock_count": out_of_stock,
            "overstocked_count": overstocked,
            "healthy_stock_count": total_products - low_stock - out_of_stock - overstocked,
            "health_score": ((total_products - low_stock - out_of_stock) / total_products) * 100 if total_products > 0 else 0
        }
    
    async def _identify_slow_moving_items(self, shop_id: str) -> List[Dict]:
        """Identify slow-moving inventory items"""
        # Get sales data for the last 90 days
        sales_data = await self.db_manager.get_sales_data(shop_id, days=90)
        
        slow_moving = []
        for item in sales_data:
            if item.get('sales_velocity', 0) < 0.1:  # Less than 0.1 units per day
                slow_moving.append({
                    "product_id": item.get('product_id'),
                    "product_name": item.get('product_name'),
                    "current_stock": item.get('current_stock', 0),
                    "sales_velocity": item.get('sales_velocity', 0),
                    "days_of_stock": item.get('days_of_stock', 0),
                    "recommendation": "Consider discounting or bundling"
                })
        
        return slow_moving
    
    async def _identify_fast_moving_items(self, shop_id: str) -> List[Dict]:
        """Identify fast-moving inventory items"""
        sales_data = await self.db_manager.get_sales_data(shop_id, days=90)
        
        fast_moving = []
        for item in sales_data:
            if item.get('sales_velocity', 0) > 1.0:  # More than 1 unit per day
                fast_moving.append({
                    "product_id": item.get('product_id'),
                    "product_name": item.get('product_name'),
                    "current_stock": item.get('current_stock', 0),
                    "sales_velocity": item.get('sales_velocity', 0),
                    "days_of_stock": item.get('days_of_stock', 0),
                    "recommendation": "Consider increasing reorder level"
                })
        
        return fast_moving
    
    async def _check_expiry_risks(self, inventory_data: List[Dict]) -> List[Dict]:
        """Check for products nearing expiry"""
        expiry_risks = []
        current_date = datetime.utcnow()
        
        for item in inventory_data:
            expiry_date = item.get('expiry_date')
            if expiry_date:
                days_to_expiry = (expiry_date - current_date).days
                if days_to_expiry <= 30:  # Within 30 days
                    expiry_risks.append({
                        "product_id": item.get('product_id'),
                        "product_name": item.get('product_name'),
                        "batch_no": item.get('batch_no'),
                        "quantity": item.get('quantity', 0),
                        "expiry_date": expiry_date.isoformat(),
                        "days_to_expiry": days_to_expiry,
                        "risk_level": "high" if days_to_expiry <= 7 else "medium"
                    })
        
        return expiry_risks
    
    async def _generate_inventory_recommendations(self, stock_analysis: Dict, slow_moving: List, fast_moving: List, expiry_risks: List) -> List[str]:
        """Generate AI-powered inventory recommendations"""
        recommendations = []
        
        # Stock level recommendations
        if stock_analysis['low_stock_count'] > 0:
            recommendations.append(f"Reorder {stock_analysis['low_stock_count']} low-stock items immediately")
        
        if stock_analysis['out_of_stock_count'] > 0:
            recommendations.append(f"Urgent: {stock_analysis['out_of_stock_count']} items are out of stock")
        
        if stock_analysis['overstocked_count'] > 0:
            recommendations.append(f"Consider discounting {stock_analysis['overstocked_count']} overstocked items")
        
        # Slow-moving items recommendations
        if slow_moving:
            recommendations.append(f"Create promotional campaigns for {len(slow_moving)} slow-moving items")
        
        # Fast-moving items recommendations
        if fast_moving:
            recommendations.append(f"Increase reorder levels for {len(fast_moving)} fast-moving items")
        
        # Expiry risk recommendations
        if expiry_risks:
            high_risk = len([r for r in expiry_risks if r['risk_level'] == 'high'])
            if high_risk > 0:
                recommendations.append(f"URGENT: {high_risk} items expire within 7 days")
            recommendations.append(f"Create clearance sale for {len(expiry_risks)} items nearing expiry")
        
        return recommendations
    
    async def suggest_reorder_quantities(self, shop_id: str) -> List[Dict]:
        """Suggest optimal reorder quantities using AI forecasting"""
        try:
            # Get products that need reordering
            low_stock_items = await self.db_manager.get_low_stock_items(shop_id)
            
            reorder_suggestions = []
            
            for item in low_stock_items:
                # Get demand forecast
                forecast = await self.forecasting_service.forecast_demand(
                    product_id=item['product_id'],
                    shop_id=shop_id,
                    days_ahead=30
                )
                
                # Calculate optimal reorder quantity
                current_stock = item.get('quantity', 0)
                forecasted_demand = forecast.get('forecasted_quantity', 0)
                lead_time_days = item.get('lead_time_days', 7)
                safety_stock = forecasted_demand * 0.2  # 20% safety buffer
                
                optimal_stock = forecasted_demand + safety_stock
                reorder_quantity = max(0, optimal_stock - current_stock)
                
                reorder_suggestions.append({
                    "product_id": item['product_id'],
                    "product_name": item['product_name'],
                    "current_stock": current_stock,
                    "forecasted_demand": forecasted_demand,
                    "suggested_reorder_quantity": int(reorder_quantity),
                    "confidence_score": forecast.get('confidence_score', 0),
                    "reasoning": f"Based on {forecasted_demand} units forecasted demand over 30 days"
                })
            
            return reorder_suggestions
            
        except Exception as e:
            logger.error(f"Error suggesting reorder quantities: {str(e)}")
            return []
    
    async def optimize_inventory_allocation(self, shop_id: str) -> Dict[str, Any]:
        """Optimize inventory allocation across multiple locations"""
        try:
            # Get inventory data for all shops
            all_shops = await self.db_manager.get_all_shops()
            inventory_allocation = {}
            
            for shop in all_shops:
                shop_inventory = await self.db_manager.get_inventory_data(shop['id'])
                inventory_allocation[shop['id']] = shop_inventory
            
            # Analyze demand patterns
            demand_patterns = await self._analyze_demand_patterns(shop_id)
            
            # Generate allocation recommendations
            recommendations = await self._generate_allocation_recommendations(
                inventory_allocation, demand_patterns
            )
            
            return {
                "success": True,
                "recommendations": recommendations,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error optimizing inventory allocation: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _analyze_demand_patterns(self, shop_id: str) -> Dict[str, Any]:
        """Analyze demand patterns for inventory optimization"""
        # Get historical sales data
        sales_data = await self.db_manager.get_sales_data(shop_id, days=365)
        
        # Analyze seasonal patterns
        seasonal_patterns = {}
        for month in range(1, 13):
            month_sales = [s for s in sales_data if s.get('month') == month]
            seasonal_patterns[month] = {
                "total_sales": sum(s.get('quantity', 0) for s in month_sales),
                "avg_daily_sales": sum(s.get('quantity', 0) for s in month_sales) / 30
            }
        
        # Identify peak and low seasons
        peak_month = max(seasonal_patterns.keys(), key=lambda k: seasonal_patterns[k]['total_sales'])
        low_month = min(seasonal_patterns.keys(), key=lambda k: seasonal_patterns[k]['total_sales'])
        
        return {
            "seasonal_patterns": seasonal_patterns,
            "peak_season": peak_month,
            "low_season": low_month,
            "seasonality_factor": seasonal_patterns[peak_month]['total_sales'] / seasonal_patterns[low_month]['total_sales'] if seasonal_patterns[low_month]['total_sales'] > 0 else 1
        }
    
    async def _generate_allocation_recommendations(self, inventory_allocation: Dict, demand_patterns: Dict) -> List[Dict]:
        """Generate inventory allocation recommendations"""
        recommendations = []
        
        # Analyze stock imbalances
        for product_id in set().union(*[shop_inv.keys() for shop_inv in inventory_allocation.values()]):
            product_stock = {}
            for shop_id, shop_inventory in inventory_allocation.items():
                for item in shop_inventory:
                    if item.get('product_id') == product_id:
                        product_stock[shop_id] = item.get('quantity', 0)
            
            if len(product_stock) > 1:
                # Find shops with excess stock
                total_stock = sum(product_stock.values())
                avg_stock = total_stock / len(product_stock)
                
                for shop_id, stock in product_stock.items():
                    if stock > avg_stock * 1.5:  # 50% above average
                        recommendations.append({
                            "type": "redistribution",
                            "product_id": product_id,
                            "from_shop": shop_id,
                            "excess_quantity": int(stock - avg_stock),
                            "suggestion": f"Transfer {int(stock - avg_stock)} units to other shops"
                        })
        
        return recommendations
    
    async def predict_seasonal_demand(self, shop_id: str, product_id: str) -> Dict[str, Any]:
        """Predict seasonal demand for a specific product"""
        try:
            # Get historical sales data
            sales_data = await self.db_manager.get_product_sales_history(product_id, shop_id, days=365)
            
            if not sales_data:
                return {"success": False, "error": "Insufficient sales data"}
            
            # Analyze seasonal patterns
            monthly_sales = {}
            for sale in sales_data:
                month = sale.get('created_at').month
                if month not in monthly_sales:
                    monthly_sales[month] = 0
                monthly_sales[month] += sale.get('quantity', 0)
            
            # Calculate seasonal factors
            avg_monthly_sales = sum(monthly_sales.values()) / 12
            seasonal_factors = {}
            for month, sales in monthly_sales.items():
                seasonal_factors[month] = sales / avg_monthly_sales if avg_monthly_sales > 0 else 1
            
            # Predict next 12 months
            predictions = {}
            for month in range(1, 13):
                base_demand = avg_monthly_sales
                seasonal_factor = seasonal_factors.get(month, 1)
                predictions[month] = {
                    "predicted_demand": int(base_demand * seasonal_factor),
                    "seasonal_factor": seasonal_factor,
                    "confidence": 0.8 if seasonal_factor > 0.5 else 0.6
                }
            
            return {
                "success": True,
                "predictions": predictions,
                "seasonal_factors": seasonal_factors,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error predicting seasonal demand: {str(e)}")
            return {"success": False, "error": str(e)}
