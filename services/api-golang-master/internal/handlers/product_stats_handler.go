package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProductStatsHandler struct {
	db *gorm.DB
}

func NewProductStatsHandler(db *gorm.DB) *ProductStatsHandler {
	return &ProductStatsHandler{db: db}
}

// GetProductStats - GET /api/erp/products/stats
// Returns product statistics for Smart Insights
func (h *ProductStatsHandler) GetProductStats(c *gin.Context) {
	var stats struct {
		TotalProducts   int64   `json:"total_products"`
		ActiveProducts  int64   `json:"active_products"`
		LowStockCount   int64   `json:"low_stock_count"`
		OutOfStockCount int64   `json:"out_of_stock_count"`
		TotalCategories int64   `json:"total_categories"`
		TotalBrands     int64   `json:"total_brands"`
		TotalValue      float64 `json:"total_inventory_value"`
		AvgCostPrice    float64 `json:"avg_cost_price"`
		AvgSellingPrice float64 `json:"avg_selling_price"`
		HighValueProducts int64 `json:"high_value_products"`
	}

	// Total products
	h.db.Table("products").Count(&stats.TotalProducts)

	// Active products
	h.db.Table("products").Where("is_active = ?", true).Count(&stats.ActiveProducts)

	// Low stock count (current_stock <= min_stock)
	h.db.Table("products").Where("current_stock <= min_stock AND min_stock > 0").Count(&stats.LowStockCount)

	// Out of stock
	h.db.Table("products").Where("current_stock = 0 OR current_stock IS NULL").Count(&stats.OutOfStockCount)

	// Total unique categories
	h.db.Table("products").Distinct("category").Count(&stats.TotalCategories)

	// Total unique brands
	h.db.Table("products").Distinct("brand").Count(&stats.TotalBrands)

	// Total inventory value (cost_price * current_stock)
	var totalValue struct {
		Value float64
	}
	h.db.Table("products").Select("COALESCE(SUM(cost_price * current_stock), 0) as value").Scan(&totalValue)
	stats.TotalValue = totalValue.Value

	// Average cost price
	var avgCost struct {
		Avg float64
	}
	h.db.Table("products").Select("COALESCE(AVG(cost_price), 0) as avg").Where("cost_price > 0").Scan(&avgCost)
	stats.AvgCostPrice = avgCost.Avg

	// Average selling price
	var avgSelling struct {
		Avg float64
	}
	h.db.Table("products").Select("COALESCE(AVG(selling_price), 0) as avg").Where("selling_price > 0").Scan(&avgSelling)
	stats.AvgSellingPrice = avgSelling.Avg

	// High value products (selling_price * current_stock > 10000)
	h.db.Table("products").Where("(selling_price * current_stock) > ?", 10000).Count(&stats.HighValueProducts)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}
