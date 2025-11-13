package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type ExpiryHandler struct {
	Service *services.ExpiryService
}

func NewExpiryHandler(s *services.ExpiryService) *ExpiryHandler {
	return &ExpiryHandler{Service: s}
}

// GET /api/v2/inventory/expiries?shop_id=... or /api/erp/dashboard/expiry-summary
func (h *ExpiryHandler) GetExpirySummary(c *gin.Context) {
	shopID := c.Query("shop_id")
	// Make shop_id optional for backwards compatibility
	if shopID == "" {
		shopID = "default" // Use default shop if not specified
	}
	rows, err := h.Service.ComputeSummary(c, shopID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error(), "success": false})
		return
	}
	c.JSON(200, gin.H{"summary": rows, "success": true})
}

// POST /api/v2/inventory/expiries/refresh?shop_id=...
func (h *ExpiryHandler) RefreshExpirySummary(c *gin.Context) {
	shopID := c.Query("shop_id")
	rows, err := h.Service.ComputeSummary(c, shopID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Optionally: persist summary for dashboard widgets (idempotent upsert)
	// We keep it best-effort; failure to persist should not 500
	for _, r := range rows {
		_ = h.Service.DB.Exec(`
			INSERT INTO expiry_alerts_summary (shop_id, window_label, count_items, sample_products, computed_at)
			VALUES (?, ?, ?, '[]'::jsonb, now())
			ON CONFLICT (shop_id, window_label) DO UPDATE SET
			  count_items = EXCLUDED.count_items,
			  computed_at = EXCLUDED.computed_at
		`, shopID, r.WindowLabel, r.CountItems).Error
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "updated": len(rows)})
}

// GET /api/v2/inventory/expiries/alerts?shop_id=...&window=...&limit=50
func (h *ExpiryHandler) GetExpiryAlerts(c *gin.Context) {
	shopID := c.Query("shop_id")
	window := c.DefaultQuery("window", "7_days")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	rows, err := h.Service.Alerts(c, shopID, window, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// GET /api/v2/dashboard/expiry-summary?shop_id=...
func (h *ExpiryHandler) GetDashboardSummary(c *gin.Context) {
	shopID := c.Query("shop_id")
	rows, err := h.Service.ComputeSummary(c, shopID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}
