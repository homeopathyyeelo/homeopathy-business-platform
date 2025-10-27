# Integration with Go Backend Services
import requests
import json
from typing import Dict, List, Any
import time

class GoServiceIntegration:
    """Integrate ML models with existing Go backend services"""

    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.headers = {'Content-Type': 'application/json'}

    def call_product_recommendation_api(self, product_id: str, customer_id: str = None) -> Dict:
        """Call Go API for product recommendations"""
        endpoint = f"{self.base_url}/api/v1/ai/recommendations/products"

        payload = {
            "product_id": product_id,
            "customer_id": customer_id,
            "limit": 5,
            "algorithm": "hybrid"
        }

        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error calling Go API: {e}")
            return None

    def call_demand_forecast_api(self, product_ids: List[str]) -> Dict:
        """Call Go API for demand forecasting"""
        endpoint = f"{self.base_url}/api/v1/ai/forecast/demand"

        payload = {
            "product_ids": product_ids,
            "months_ahead": 1,
            "include_confidence": True
        }

        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error calling Go API: {e}")
            return None

    def call_customer_segmentation_api(self, customer_id: str) -> Dict:
        """Call Go API for customer segmentation"""
        endpoint = f"{self.base_url}/api/v1/ai/segmentation/customers"

        payload = {
            "customer_id": customer_id,
            "include_features": True
        }

        try:
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error calling Go API: {e}")
            return None

# Example Go handler integration (pseudo-code for Go implementation)
"""
// Go Handler Example - Product Recommendations
func (h *ProductHandler) GetAIRecommendations(c *gin.Context) {
    var req struct {
        ProductID  string `json:"product_id" binding:"required"`
        CustomerID string `json:"customer_id"`
        Limit      int    `json:"limit" default:"5"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Call Python AI Service
    aiServiceURL := "http://localhost:8005/v2/recommendations/product"

    payload := map[string]interface{}{
        "product_id": req.ProductID,
        "customer_id": req.CustomerID,
        "top_n": req.Limit,
        "recommendation_type": "hybrid",
    }

    response, err := http.Post(aiServiceURL, "application/json",
        strings.NewReader(json.Marshal(payload)))

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
        return
    }

    defer response.Body.Close()

    var aiResponse map[string]interface{}
    json.NewDecoder(response.Body).Decode(&aiResponse)

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": aiResponse,
        "generated_at": time.Now(),
    })
}

// Go Handler Example - Demand Forecasting
func (h *InventoryHandler) GetDemandForecast(c *gin.Context) {
    var req struct {
        ProductIDs []string `json:"product_ids" binding:"required"`
        Months     int      `json:"months_ahead" default:"1"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Call Python AI Service
    aiServiceURL := "http://localhost:8005/v2/forecast/demand"

    payload := map[string]interface{}{
        "product_ids": req.ProductIDs,
        "months_ahead": req.Months,
        "include_confidence": true,
    }

    response, err := http.Post(aiServiceURL, "application/json",
        strings.NewReader(json.Marshal(payload)))

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
        return
    }

    defer response.Body.Close()

    var aiResponse []map[string]interface{}
    json.NewDecoder(response.Body).Decode(&aiResponse)

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "forecasts": aiResponse,
        "generated_at": time.Now(),
    })
}

// Go Handler Example - Customer Segmentation
func (h *CustomerHandler) GetCustomerSegmentation(c *gin.Context) {
    customerID := c.Param("id")

    // Call Python AI Service
    aiServiceURL := fmt.Sprintf("http://localhost:8005/v2/segmentation/customer")

    payload := map[string]interface{}{
        "customer_id": customerID,
        "include_features": true,
    }

    response, err := http.Post(aiServiceURL, "application/json",
        strings.NewReader(json.Marshal(payload)))

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "AI service unavailable"})
        return
    }

    defer response.Body.Close()

    var aiResponse map[string]interface{}
    json.NewDecoder(response.Body).Decode(&aiResponse)

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "segment": aiResponse,
        "generated_at": time.Now(),
    })
}
"""

# Real-time prediction service
class RealTimeMLService:
    """Real-time ML predictions for production use"""

    def __init__(self):
        self.ai_service_url = "http://localhost:8005"
        self.integration = GoServiceIntegration()

    async def get_product_recommendations_realtime(self, product_id: str, user_context: Dict = None):
        """Get real-time product recommendations"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "product_id": product_id,
                    "top_n": 5,
                    "recommendation_type": "hybrid"
                }

                if user_context:
                    payload["customer_id"] = user_context.get("customer_id")

                response = await client.post(
                    f"{self.ai_service_url}/v2/recommendations/product",
                    json=payload,
                    timeout=5.0
                )

                return response.json()

        except Exception as e:
            print(f"Real-time recommendation error: {e}")
            return {"error": "Service unavailable", "fallback": "popular_products"}

    async def predict_demand_realtime(self, product_ids: List[str]):
        """Get real-time demand predictions"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "product_ids": product_ids,
                    "months_ahead": 1,
                    "include_confidence": True
                }

                response = await client.post(
                    f"{self.ai_service_url}/v2/forecast/demand",
                    json=payload,
                    timeout=3.0
                )

                return response.json()

        except Exception as e:
            print(f"Real-time demand prediction error: {e}")
            return {"error": "Service unavailable", "fallback": "average_demand"}

    async def segment_customer_realtime(self, customer_id: str):
        """Get real-time customer segmentation"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "customer_id": customer_id,
                    "include_features": True
                }

                response = await client.post(
                    f"{self.ai_service_url}/v2/segmentation/customer",
                    json=payload,
                    timeout=2.0
                )

                return response.json()

        except Exception as e:
            print(f"Real-time segmentation error: {e}")
            return {"error": "Service unavailable", "fallback": "regular_customer"}
