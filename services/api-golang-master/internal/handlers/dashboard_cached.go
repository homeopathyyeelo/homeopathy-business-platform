package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/cache"
)

var g singleflight.Group

type CachedDashboardHandler struct {
	db    *gorm.DB
	cache *cache.RedisCache
}

func NewCachedDashboardHandler(db *gorm.DB, redisCache *cache.RedisCache) *CachedDashboardHandler {
	return &CachedDashboardHandler{
		db:    db,
		cache: redisCache,
	}
}

// GetCachedSummary - Dashboard summary with Redis cache + singleflight
func (h *CachedDashboardHandler) GetCachedSummary(c *gin.Context) {
	ctx := c.Request.Context()
	cacheKey := "dashboard:summary:v1"

	// Try cache first
	var summary map[string]interface{}
	ok, err := h.cache.Get(ctx, cacheKey, &summary)
	if err == nil && ok {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    summary,
			"cached":  true,
		})
		return
	}

	// Use singleflight to prevent stampede
	v, err, _ := g.Do(cacheKey, func() (interface{}, error) {
		return h.computeSummary(ctx)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to compute summary",
		})
		return
	}

	result := v.(map[string]interface{})
	
	// Cache for 30 seconds
	h.cache.Set(ctx, cacheKey, result, 30*time.Second)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
		"cached":  false,
	})
}

func (h *CachedDashboardHandler) computeSummary(ctx context.Context) (map[string]interface{}, error) {
	var totalOrders int64
	var totalRevenue float64
	var activeCustomers int64
	var lowStockItems int64

	// Example queries
	h.db.WithContext(ctx).Table("sales_orders").Where("deleted_at IS NULL").Count(&totalOrders)
	h.db.WithContext(ctx).Table("sales_orders").Where("deleted_at IS NULL").Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)
	h.db.WithContext(ctx).Table("customers").Where("deleted_at IS NULL AND is_active = true").Count(&activeCustomers)
	h.db.WithContext(ctx).Raw("SELECT COUNT(*) FROM products WHERE min_stock_level > 0").Scan(&lowStockItems)

	return map[string]interface{}{
		"total_orders":     totalOrders,
		"total_revenue":    totalRevenue,
		"active_customers": activeCustomers,
		"low_stock_items":  lowStockItems,
		"computed_at":      time.Now().Format(time.RFC3339),
	}, nil
}

// GetCachedExpirySummary - Expiry summary with caching
func (h *CachedDashboardHandler) GetCachedExpirySummary(c *gin.Context) {
	ctx := c.Request.Context()
	cacheKey := "dashboard:expiry:v1"

	var summary interface{}
	ok, err := h.cache.Get(ctx, cacheKey, &summary)
	if err == nil && ok {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    summary,
			"cached":  true,
		})
		return
	}

	v, err, _ := g.Do(cacheKey, func() (interface{}, error) {
		return h.computeExpirySummary(ctx)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to compute expiry summary",
		})
		return
	}

	h.cache.Set(ctx, cacheKey, v, 60*time.Second)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    v,
		"cached":  false,
	})
}

func (h *CachedDashboardHandler) computeExpirySummary(ctx context.Context) (interface{}, error) {
	var results []map[string]interface{}
	
	query := `
		SELECT 
			CASE 
				WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN '7d'
				WHEN expiry_date <= CURRENT_DATE + INTERVAL '1 month' THEN '1m'
				WHEN expiry_date <= CURRENT_DATE + INTERVAL '3 months' THEN '3m'
			END as window_label,
			COUNT(DISTINCT id) as count_batches,
			SUM(available_quantity) as count_items
		FROM inventory_batches
		WHERE deleted_at IS NULL
			AND expiry_date IS NOT NULL
			AND expiry_date >= CURRENT_DATE
			AND expiry_date <= CURRENT_DATE + INTERVAL '3 months'
			AND available_quantity > 0
		GROUP BY window_label
		ORDER BY 
			CASE window_label
				WHEN '7d' THEN 1
				WHEN '1m' THEN 2
				WHEN '3m' THEN 3
			END
	`
	
	h.db.WithContext(ctx).Raw(query).Scan(&results)
	
	return results, nil
}
