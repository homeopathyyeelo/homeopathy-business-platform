package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type ExpiryWindowResult struct {
	WindowLabel   string                   `json:"window_label"`
	WindowDays    int                      `json:"window_days"`
	CountItems    int                      `json:"count_items"`
	CountBatches  int                      `json:"count_batches"`
	TotalValue    float64                  `json:"total_value"`
	SampleProducts []map[string]interface{} `json:"sample_products"`
	ComputedAt    time.Time                `json:"computed_at"`
}

type ExpiryAlert struct {
	ID            string    `json:"id"`
	ProductID     string    `json:"product_id"`
	ProductName   string    `json:"product_name"`
	SKU           string    `json:"sku"`
	BatchNo       string    `json:"batch_no"`
	ExpiryDate    string    `json:"expiry_date"`
	DaysToExpiry  int       `json:"days_to_expiry"`
	AlertLevel    string    `json:"alert_level"`
	QtyAvailable  float64   `json:"qty_available"`
	TotalValue    float64   `json:"total_value"`
	Status        string    `json:"status"`
}

type ExpiryHandler struct {
	DB    *sql.DB
	Cache interface{}
}

// GetExpirySummary returns expiry summary for all windows
func (h *ExpiryHandler) GetExpirySummary(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	shopID := c.Query("shop_id")
	if shopID == "" {
		// Try to get from user context
		if sid, exists := c.Get("shop_id"); exists {
			shopID = sid.(string)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "shop_id required"})
			return
		}
	}

	// Check cache first
	cacheKey := fmt.Sprintf("expiry_summary:%s", shopID)
	// if cached := h.Cache.Get(cacheKey); cached != nil {
	//     c.JSON(http.StatusOK, gin.H{"success": true, "data": cached, "cached": true})
	//     return
	// }

	query := `
		SELECT 
			window_label,
			window_days,
			count_items,
			count_batches,
			total_value,
			sample_products,
			computed_at
		FROM expiry_alerts_summary
		WHERE shop_id = $1
		ORDER BY window_days ASC
	`

	rows, err := h.DB.QueryContext(ctx, query, shopID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expiry summary"})
		return
	}
	defer rows.Close()

	var results []ExpiryWindowResult
	for rows.Next() {
		var result ExpiryWindowResult
		var sampleJSON []byte

		err := rows.Scan(
			&result.WindowLabel,
			&result.WindowDays,
			&result.CountItems,
			&result.CountBatches,
			&result.TotalValue,
			&sampleJSON,
			&result.ComputedAt,
		)
		if err != nil {
			continue
		}

		// Parse JSON sample products
		if len(sampleJSON) > 0 {
			json.Unmarshal(sampleJSON, &result.SampleProducts)
		}

		results = append(results, result)
	}

	// If no data, compute on-the-fly
	if len(results) == 0 {
		results = h.computeExpirySummaryRealtime(ctx, shopID)
	}

	// Cache for 1 hour
	// h.Cache.Set(cacheKey, results, 1*time.Hour)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
	})
}

// GetExpiryAlerts returns detailed expiry alerts
func (h *ExpiryHandler) GetExpiryAlerts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	shopID := c.Query("shop_id")
	window := c.Query("window") // 7_days, 1_month, etc.
	alertLevel := c.Query("alert_level") // critical, warning, info
	status := c.DefaultQuery("status", "active")
	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")

	query := `
		SELECT 
			ea.id,
			ea.product_id,
			p.name as product_name,
			p.sku,
			ea.batch_no,
			ea.expiry_date,
			ea.days_to_expiry,
			ea.alert_level,
			ea.qty_available,
			ea.total_value,
			ea.status
		FROM expiry_alerts ea
		LEFT JOIN products p ON p.id = ea.product_id
		WHERE ea.shop_id = $1
		  AND ea.status = $2
	`
	args := []interface{}{shopID, status}
	argCount := 3

	if window != "" {
		query += fmt.Sprintf(" AND ea.window_label = $%d", argCount)
		args = append(args, window)
		argCount++
	}

	if alertLevel != "" {
		query += fmt.Sprintf(" AND ea.alert_level = $%d", argCount)
		args = append(args, alertLevel)
		argCount++
	}

	query += fmt.Sprintf(" ORDER BY ea.expiry_date ASC LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, limit, offset)

	rows, err := h.DB.QueryContext(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expiry alerts"})
		return
	}
	defer rows.Close()

	var alerts []ExpiryAlert
	for rows.Next() {
		var alert ExpiryAlert
		err := rows.Scan(
			&alert.ID,
			&alert.ProductID,
			&alert.ProductName,
			&alert.SKU,
			&alert.BatchNo,
			&alert.ExpiryDate,
			&alert.DaysToExpiry,
			&alert.AlertLevel,
			&alert.QtyAvailable,
			&alert.TotalValue,
			&alert.Status,
		)
		if err != nil {
			continue
		}
		alerts = append(alerts, alert)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
		"total":   len(alerts),
	})
}

// RefreshExpirySummary manually triggers expiry summary refresh
func (h *ExpiryHandler) RefreshExpirySummary(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Minute)
	defer cancel()

	shopID := c.Query("shop_id")

	// Call stored procedure
	var query string
	var args []interface{}

	if shopID != "" {
		query = "SELECT refresh_expiry_summary($1)"
		args = []interface{}{shopID}
	} else {
		query = "SELECT refresh_expiry_summary(NULL)"
		args = []interface{}{}
	}

	_, err := h.DB.ExecContext(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh expiry summary"})
		return
	}

	// Clear cache
	if shopID != "" {
		cacheKey := fmt.Sprintf("expiry_summary:%s", shopID)
		// h.Cache.Delete(cacheKey)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Expiry summary refreshed successfully",
	})
}

// AcknowledgeExpiryAlert marks an alert as acknowledged
func (h *ExpiryHandler) AcknowledgeExpiryAlert(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	alertID := c.Param("id")
	userID, _ := c.Get("user_id")

	query := `
		UPDATE expiry_alerts
		SET status = 'acknowledged',
		    acknowledged_by = $1,
		    acknowledged_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`

	_, err := h.DB.ExecContext(ctx, query, userID, alertID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to acknowledge alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Alert acknowledged",
	})
}

// ResolveExpiryAlert marks an alert as resolved with action taken
func (h *ExpiryHandler) ResolveExpiryAlert(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	alertID := c.Param("id")

	var req struct {
		ResolutionAction string  `json:"resolution_action" binding:"required"` // sold, returned, disposed, transferred
		QtyAffected      float64 `json:"qty_affected"`
		Notes            string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	// Update alert
	query := `
		UPDATE expiry_alerts
		SET status = 'resolved',
		    resolution_action = $1,
		    resolved_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
		RETURNING batch_id
	`

	var batchID string
	err := h.DB.QueryRowContext(ctx, query, req.ResolutionAction, alertID).Scan(&batchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve alert"})
		return
	}

	// Log action
	logQuery := `
		INSERT INTO expiry_actions_log (
			alert_id, batch_id, action_type, action_details,
			qty_affected, performed_by, performed_at
		) VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`

	actionDetails, _ := json.Marshal(map[string]string{"notes": req.Notes})
	h.DB.ExecContext(ctx, logQuery, alertID, batchID, req.ResolutionAction, actionDetails, req.QtyAffected, userID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Alert resolved",
	})
}

// Helper function to compute expiry summary in real-time
func (h *ExpiryHandler) computeExpirySummaryRealtime(ctx context.Context, shopID string) []ExpiryWindowResult {
	windows := []struct {
		Label   string
		Days    int
		MinDays int
		MaxDays int
	}{
		{"7_days", 7, 0, 7},
		{"1_month", 30, 8, 30},
		{"2_months", 60, 31, 60},
		{"3_months", 90, 61, 90},
		{"6_months", 180, 91, 180},
		{"1_year", 365, 181, 365},
		{"60_months", 1800, 366, 1800},
	}

	var results []ExpiryWindowResult

	for _, w := range windows {
		query := `
			SELECT 
				COUNT(DISTINCT ib.product_id) as count_items,
				COUNT(*) as count_batches,
				COALESCE(SUM(ib.qty_available * ib.unit_cost), 0) as total_value,
				jsonb_agg(
					jsonb_build_object(
						'product_id', ib.product_id,
						'product_name', p.name,
						'sku', p.sku,
						'batch_no', ib.batch_no,
						'expiry_date', ib.expiry_date,
						'days_to_expiry', (ib.expiry_date - CURRENT_DATE),
						'qty_available', ib.qty_available,
						'total_value', (ib.qty_available * ib.unit_cost)
					) ORDER BY ib.expiry_date LIMIT 10
				) as sample
			FROM inventory_batches ib
			LEFT JOIN products p ON p.id = ib.product_id
			WHERE ib.shop_id = $1
			  AND ib.status = 'active'
			  AND ib.expiry_date IS NOT NULL
			  AND ib.qty_available > 0
			  AND (ib.expiry_date - CURRENT_DATE) BETWEEN $2 AND $3
		`

		var countItems, countBatches int
		var totalValue float64
		var sampleJSON []byte

		err := h.DB.QueryRowContext(ctx, query, shopID, w.MinDays, w.MaxDays).Scan(
			&countItems, &countBatches, &totalValue, &sampleJSON,
		)

		if err != nil || countItems == 0 {
			continue
		}

		var sampleProducts []map[string]interface{}
		if len(sampleJSON) > 0 {
			json.Unmarshal(sampleJSON, &sampleProducts)
		}

		results = append(results, ExpiryWindowResult{
			WindowLabel:    w.Label,
			WindowDays:     w.Days,
			CountItems:     countItems,
			CountBatches:   countBatches,
			TotalValue:     totalValue,
			SampleProducts: sampleProducts,
			ComputedAt:     time.Now(),
		})
	}

	return results
}
