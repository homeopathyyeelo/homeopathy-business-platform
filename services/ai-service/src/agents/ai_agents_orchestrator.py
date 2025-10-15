"""
AI Agents Orchestrator
Coordinates all AI agents and manages automated workflows
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json

from .content_agent import ContentAgent
from .inventory_agent import InventoryAgent
from .customer_agent import CustomerAgent
from ..ai_models import AIModelManager
from ..database import DatabaseManager
from ..forecasting import DemandForecastingService
from ..rag import RAGService

logger = logging.getLogger(__name__)

class AIAgentsOrchestrator:
    def __init__(
        self,
        ai_models: AIModelManager,
        db_manager: DatabaseManager,
        forecasting_service: DemandForecastingService,
        rag_service: RAGService,
    ):
        self.ai_models = ai_models
        self.db_manager = db_manager
        self.forecasting_service = forecasting_service

        # Initialize agents using pre-initialized services
        self.content_agent = ContentAgent(ai_models, rag_service, db_manager)
        self.inventory_agent = InventoryAgent(ai_models, db_manager, forecasting_service)
        self.customer_agent = CustomerAgent(ai_models, db_manager)
        
    async def run_daily_automation(self, shop_id: str) -> Dict[str, Any]:
        """Run daily automation workflows"""
        try:
            logger.info(f"Starting daily automation for shop {shop_id}")
            
            # Run all daily tasks in parallel
            tasks = [
                self._run_content_automation(shop_id),
                self._run_inventory_automation(shop_id),
                self._run_customer_automation(shop_id),
                self._run_business_intelligence(shop_id)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            automation_results = {
                "content_automation": results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])},
                "inventory_automation": results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])},
                "customer_automation": results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])},
                "business_intelligence": results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])}
            }
            
            # Save automation results
            await self._save_automation_results(shop_id, automation_results)
            
            return {
                "success": True,
                "shop_id": shop_id,
                "automation_results": automation_results,
                "completed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in daily automation: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _run_content_automation(self, shop_id: str) -> Dict[str, Any]:
        """Run content generation automation"""
        try:
            # Generate daily content
            content_result = await self.content_agent.generate_daily_content(shop_id)
            
            if content_result.get("success"):
                # Schedule content for publishing
                await self._schedule_content_publishing(shop_id, content_result["content"])
                
                return {
                    "success": True,
                    "content_generated": len(content_result["content"]),
                    "platforms": list(content_result["content"].keys())
                }
            else:
                return content_result
                
        except Exception as e:
            logger.error(f"Error in content automation: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _run_inventory_automation(self, shop_id: str) -> Dict[str, Any]:
        """Run inventory management automation"""
        try:
            # Analyze inventory health
            inventory_analysis = await self.inventory_agent.analyze_inventory_health(shop_id)
            
            if inventory_analysis.get("success"):
                # Generate reorder suggestions
                reorder_suggestions = await self.inventory_agent.suggest_reorder_quantities(shop_id)
                
                # Check for urgent actions needed
                urgent_actions = await self._identify_urgent_inventory_actions(inventory_analysis)
                
                return {
                    "success": True,
                    "inventory_health_score": inventory_analysis["analysis"]["stock_levels"]["health_score"],
                    "reorder_suggestions": len(reorder_suggestions),
                    "urgent_actions": urgent_actions
                }
            else:
                return inventory_analysis
                
        except Exception as e:
            logger.error(f"Error in inventory automation: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _run_customer_automation(self, shop_id: str) -> Dict[str, Any]:
        """Run customer management automation"""
        try:
            # Analyze customer segments
            segment_analysis = await self.customer_agent.analyze_customer_segments(shop_id)
            
            # Predict customer churn
            churn_prediction = await self.customer_agent.predict_customer_churn(shop_id)
            
            if segment_analysis.get("success") and churn_prediction.get("success"):
                # Generate engagement campaigns
                engagement_campaigns = await self._generate_engagement_campaigns(
                    segment_analysis, churn_prediction
                )
                
                return {
                    "success": True,
                    "customer_segments": len(segment_analysis.get("segments", {})),
                    "high_risk_customers": churn_prediction.get("high_risk_count", 0),
                    "engagement_campaigns": len(engagement_campaigns)
                }
            else:
                return {"success": False, "error": "Customer analysis failed"}
                
        except Exception as e:
            logger.error(f"Error in customer automation: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _run_business_intelligence(self, shop_id: str) -> Dict[str, Any]:
        """Run business intelligence automation"""
        try:
            # Generate daily business insights
            insights = await self._generate_daily_insights(shop_id)
            
            # Analyze performance metrics
            performance_metrics = await self._analyze_performance_metrics(shop_id)
            
            # Generate recommendations
            recommendations = await self._generate_business_recommendations(insights, performance_metrics)
            
            return {
                "success": True,
                "insights_generated": len(insights),
                "performance_metrics": performance_metrics,
                "recommendations": len(recommendations)
            }
            
        except Exception as e:
            logger.error(f"Error in business intelligence: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _identify_urgent_inventory_actions(self, inventory_analysis: Dict) -> List[Dict]:
        """Identify urgent inventory actions needed"""
        urgent_actions = []
        
        analysis = inventory_analysis.get("analysis", {})
        
        # Check for out of stock items
        out_of_stock = analysis.get("stock_levels", {}).get("out_of_stock_count", 0)
        if out_of_stock > 0:
            urgent_actions.append({
                "type": "out_of_stock",
                "priority": "high",
                "message": f"{out_of_stock} items are out of stock",
                "action": "immediate_reorder"
            })
        
        # Check for expiry risks
        expiry_risks = analysis.get("expiry_risks", [])
        high_risk_expiry = len([r for r in expiry_risks if r.get("risk_level") == "high"])
        if high_risk_expiry > 0:
            urgent_actions.append({
                "type": "expiry_risk",
                "priority": "high",
                "message": f"{high_risk_expiry} items expire within 7 days",
                "action": "clearance_sale"
            })
        
        # Check for low stock items
        low_stock = analysis.get("stock_levels", {}).get("low_stock_count", 0)
        if low_stock > 5:
            urgent_actions.append({
                "type": "low_stock",
                "priority": "medium",
                "message": f"{low_stock} items are low on stock",
                "action": "reorder_soon"
            })
        
        return urgent_actions
    
    async def _generate_engagement_campaigns(self, segment_analysis: Dict, churn_prediction: Dict) -> List[Dict]:
        """Generate engagement campaigns based on customer analysis"""
        campaigns = []
        
        # Generate campaigns for high-risk customers
        high_risk_customers = [c for c in churn_prediction.get("churn_predictions", []) if c.get("churn_risk", 0) > 0.7]
        
        if high_risk_customers:
            campaigns.append({
                "type": "retention",
                "target": "high_risk_customers",
                "customer_count": len(high_risk_customers),
                "strategy": "personalized_re_engagement",
                "channels": ["whatsapp", "email", "sms"]
            })
        
        # Generate campaigns for customer segments
        segments = segment_analysis.get("segments", {})
        for segment_name, segment_data in segments.items():
            if segment_data.get("customer_count", 0) > 0:
                campaigns.append({
                    "type": "segment_engagement",
                    "target": segment_name,
                    "customer_count": segment_data.get("customer_count", 0),
                    "strategy": segment_data.get("characteristics", [])[0] if segment_data.get("characteristics") else "general_engagement",
                    "channels": ["whatsapp", "instagram", "facebook"]
                })
        
        return campaigns
    
    async def _generate_daily_insights(self, shop_id: str) -> List[Dict]:
        """Generate daily business insights"""
        insights = []
        
        # Get yesterday's data
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        # Sales insights
        sales_data = await self.db_manager.get_daily_sales(shop_id, yesterday)
        if sales_data:
            insights.append({
                "type": "sales",
                "title": "Yesterday's Sales Performance",
                "value": sales_data.get("total_sales", 0),
                "trend": sales_data.get("trend", "stable"),
                "insight": f"Sales: ₹{sales_data.get('total_sales', 0):.2f} ({sales_data.get('order_count', 0)} orders)"
            })
        
        # Inventory insights
        inventory_data = await self.db_manager.get_inventory_summary(shop_id)
        if inventory_data:
            low_stock_count = inventory_data.get("low_stock_count", 0)
            if low_stock_count > 0:
                insights.append({
                    "type": "inventory",
                    "title": "Inventory Alert",
                    "value": low_stock_count,
                    "trend": "declining",
                    "insight": f"{low_stock_count} items need reordering"
                })
        
        # Customer insights
        customer_data = await self.db_manager.get_customer_metrics(shop_id)
        if customer_data:
            new_customers = customer_data.get("new_customers_today", 0)
            if new_customers > 0:
                insights.append({
                    "type": "customers",
                    "title": "New Customers",
                    "value": new_customers,
                    "trend": "growing",
                    "insight": f"{new_customers} new customers acquired"
                })
        
        return insights
    
    async def _analyze_performance_metrics(self, shop_id: str) -> Dict[str, Any]:
        """Analyze key performance metrics"""
        try:
            # Get metrics for the last 7 days
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=7)
            
            metrics = await self.db_manager.get_performance_metrics(shop_id, start_date, end_date)
            
            return {
                "revenue": metrics.get("total_revenue", 0),
                "orders": metrics.get("total_orders", 0),
                "customers": metrics.get("total_customers", 0),
                "avg_order_value": metrics.get("avg_order_value", 0),
                "growth_rate": metrics.get("growth_rate", 0)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing performance metrics: {str(e)}")
            return {}
    
    async def _generate_business_recommendations(self, insights: List[Dict], metrics: Dict) -> List[Dict]:
        """Generate business recommendations based on insights and metrics"""
        recommendations = []
        
        # Analyze insights for recommendations
        for insight in insights:
            if insight["type"] == "inventory" and insight["value"] > 0:
                recommendations.append({
                    "type": "inventory",
                    "priority": "high",
                    "title": "Reorder Low Stock Items",
                    "description": f"Replenish {insight['value']} low-stock items to avoid stockouts",
                    "action": "create_purchase_orders"
                })
            
            elif insight["type"] == "sales" and insight["trend"] == "declining":
                recommendations.append({
                    "type": "marketing",
                    "priority": "medium",
                    "title": "Boost Sales Performance",
                    "description": "Sales are declining - consider promotional campaigns",
                    "action": "launch_sales_campaign"
                })
        
        # Analyze metrics for recommendations
        if metrics.get("growth_rate", 0) < 0:
            recommendations.append({
                "type": "growth",
                "priority": "high",
                "title": "Address Declining Growth",
                "description": "Business growth is declining - review strategy",
                "action": "strategic_review"
            })
        
        return recommendations
    
    async def _schedule_content_publishing(self, shop_id: str, content: Dict[str, Any]):
        """Schedule content for publishing across platforms"""
        try:
            for platform, platform_content in content.items():
                await self.db_manager.schedule_content({
                    "shop_id": shop_id,
                    "platform": platform,
                    "content": platform_content["content"],
                    "scheduled_for": platform_content.get("scheduled_for"),
                    "status": "scheduled"
                })
        except Exception as e:
            logger.error(f"Error scheduling content: {str(e)}")
    
    async def _save_automation_results(self, shop_id: str, results: Dict[str, Any]):
        """Save automation results to database"""
        try:
            await self.db_manager.save_automation_log({
                "shop_id": shop_id,
                "automation_type": "daily",
                "results": results,
                "status": "completed",
                "completed_at": datetime.utcnow()
            })
        except Exception as e:
            logger.error(f"Error saving automation results: {str(e)}")
    
    async def run_weekly_analysis(self, shop_id: str) -> Dict[str, Any]:
        """Run weekly comprehensive analysis"""
        try:
            logger.info(f"Starting weekly analysis for shop {shop_id}")
            
            # Run comprehensive analysis
            analysis_tasks = [
                self._run_weekly_sales_analysis(shop_id),
                self._run_weekly_inventory_analysis(shop_id),
                self._run_weekly_customer_analysis(shop_id),
                self._run_weekly_financial_analysis(shop_id)
            ]
            
            results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
            
            # Compile weekly report
            weekly_report = {
                "shop_id": shop_id,
                "analysis_period": "weekly",
                "sales_analysis": results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])},
                "inventory_analysis": results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])},
                "customer_analysis": results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])},
                "financial_analysis": results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])},
                "generated_at": datetime.utcnow().isoformat()
            }
            
            # Save weekly report
            await self.db_manager.save_weekly_report(weekly_report)
            
            return {
                "success": True,
                "weekly_report": weekly_report
            }
            
        except Exception as e:
            logger.error(f"Error in weekly analysis: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _run_weekly_sales_analysis(self, shop_id: str) -> Dict[str, Any]:
        """Run weekly sales analysis"""
        # Implementation for weekly sales analysis
        return {"status": "completed", "insights": []}
    
    async def _run_weekly_inventory_analysis(self, shop_id: str) -> Dict[str, Any]:
        """Run weekly inventory analysis"""
        # Implementation for weekly inventory analysis
        return {"status": "completed", "insights": []}
    
    async def _run_weekly_customer_analysis(self, shop_id: str) -> Dict[str, Any]:
        """Run weekly customer analysis"""
        # Implementation for weekly customer analysis
        return {"status": "completed", "insights": []}
    
    async def _run_weekly_financial_analysis(self, shop_id: str) -> Dict[str, Any]:
        """Run weekly financial analysis"""
        # Implementation for weekly financial analysis
        return {"status": "completed", "insights": []}
