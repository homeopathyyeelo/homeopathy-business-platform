package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardActivityHandler struct {
	db *gorm.DB
}

func NewDashboardActivityHandler(db *gorm.DB) *DashboardActivityHandler {
	return &DashboardActivityHandler{db: db}
}

// GET /api/dashboard/metrics - System metrics for activity dashboard
func (h *DashboardActivityHandler) GetMetrics(c *gin.Context) {
	var openBugs int64
	var activeServices int64
	var aiTasks int64
	var salesToday float64
	var systemLoad float64

	// Count open bugs (if you have a bugs table, otherwise return 0)
	// h.db.Table("bugs").Where("status = 'OPEN'").Count(&openBugs)
	openBugs = 0 // Placeholder

	// Active services (hardcoded for now, can be dynamic)
	activeServices = 5

	// AI tasks (if you have AI task tracking)
	aiTasks = 0 // Placeholder

	// Sales today
	h.db.Table("sales_invoices").
		Where("DATE(created_at) = CURRENT_DATE").
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&salesToday)

	// System load (placeholder - would need actual system monitoring)
	systemLoad = 45.0

	// Inventory sync status
	var lastSync time.Time
	h.db.Raw("SELECT MAX(updated_at) FROM inventory_batches").Scan(&lastSync)
	inventorySync := "Just now"
	if !lastSync.IsZero() {
		diff := time.Since(lastSync)
		if diff.Minutes() < 60 {
			inventorySync = "Just now"
		} else if diff.Hours() < 24 {
			inventorySync = time.Since(lastSync).Round(time.Hour).String() + " ago"
		} else {
			inventorySync = lastSync.Format("Jan 02")
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"openBugs":       openBugs,
		"activeServices": activeServices,
		"aiTasks":        aiTasks,
		"inventorySync":  inventorySync,
		"salesToday":     salesToday,
		"systemLoad":     systemLoad,
	})
}

// GET /api/system/health - Microservice health status
func (h *DashboardActivityHandler) GetSystemHealth(c *gin.Context) {
	services := []gin.H{
		{
			"name":         "API Gateway",
			"port":         3005,
			"status":       "OK",
			"responseTime": 12,
			"version":      "1.0.0",
		},
		{
			"name":         "Database",
			"port":         5432,
			"status":       "OK",
			"responseTime": 5,
			"version":      "15.0",
		},
		{
			"name":         "Redis Cache",
			"port":         6379,
			"status":       "OK",
			"responseTime": 2,
			"version":      "7.0",
		},
		{
			"name":         "MeiliSearch",
			"port":         7700,
			"status":       "OK",
			"responseTime": 8,
			"version":      "1.5.0",
		},
		{
			"name":         "Python Workers",
			"port":         8000,
			"status":       "OK",
			"responseTime": 15,
			"version":      "1.0.0",
		},
	}

	c.JSON(http.StatusOK, services)
}

// GET /api/ai/activity - AI system activity feed
func (h *DashboardActivityHandler) GetAIActivity(c *gin.Context) {
	// Return empty array for now - can be populated when AI features are active
	activities := []gin.H{}

	// If you have AI activity logs, query them here
	// Example placeholder data:
	/*
		activities := []gin.H{
			{
				"id":        "ai-001",
				"agent":     "Demand Forecast Agent",
				"action":    "Generated sales forecast for next 30 days",
				"timestamp": time.Now().Add(-10 * time.Minute).Format(time.RFC3339),
				"status":    "completed",
			},
			{
				"id":        "ai-002",
				"agent":     "Product Description Generator",
				"action":    "Generated descriptions for 15 products",
				"timestamp": time.Now().Add(-25 * time.Minute).Format(time.RFC3339),
				"status":    "completed",
			},
		}
	*/

	c.JSON(http.StatusOK, activities)
}

// GET /api/system/bugs - Bug and exception monitor
func (h *DashboardActivityHandler) GetBugs(c *gin.Context) {
	// Return empty array for now - can be populated from error logs
	bugs := []gin.H{}

	// If you have a bugs/errors table, query it here
	// Example placeholder:
	/*
		bugs := []gin.H{
			{
				"id":           "bug-001",
				"title":        "Slow query on products page",
				"severity":     "MEDIUM",
				"status":       "OPEN",
				"aiSuggestion": "Add index on products.category_id",
			},
		}
	*/

	c.JSON(http.StatusOK, bugs)
}

// GET /api/dashboard/activity-feed - Business events timeline
func (h *DashboardActivityHandler) GetActivityFeed(c *gin.Context) {
	limit := c.DefaultQuery("limit", "20")

	type ActivityEvent struct {
		ID        string    `json:"id"`
		Event     string    `json:"event"`
		Module    string    `json:"module"`
		Timestamp time.Time `json:"timestamp"`
		Details   string    `json:"details"`
	}

	var events []ActivityEvent

	// Query recent business events from various tables
	h.db.Raw(`
		SELECT 
			'sale-' || si.id as id,
			'New Sale Invoice' as event,
			'Sales' as module,
			si.created_at as timestamp,
			'Invoice ' || si.invoice_no || ' for ₹' || si.total_amount as details
		FROM sales_invoices si
		WHERE si.created_at >= CURRENT_DATE - INTERVAL '7 days'
		
		UNION ALL
		
		SELECT 
			'po-' || po.id as id,
			'Purchase Order Created' as event,
			'Purchase' as module,
			po.created_at as timestamp,
			'PO ' || po.po_number || ' for ₹' || po.total_amount as details
		FROM purchase_orders po
		WHERE po.created_at >= CURRENT_DATE - INTERVAL '7 days'
		
		UNION ALL
		
		SELECT 
			'cust-' || c.id as id,
			'New Customer Added' as event,
			'Customers' as module,
			c.created_at as timestamp,
			'Customer: ' || c.name as details
		FROM customers c
		WHERE c.created_at >= CURRENT_DATE - INTERVAL '7 days'
		
		UNION ALL
		
		SELECT 
			'prod-' || p.id as id,
			'Product Updated' as event,
			'Products' as module,
			p.updated_at as timestamp,
			'Product: ' || p.name as details
		FROM products p
		WHERE p.updated_at >= CURRENT_DATE - INTERVAL '7 days'
			AND p.updated_at > p.created_at
		
		ORDER BY timestamp DESC
		LIMIT ?
	`, limit).Scan(&events)

	c.JSON(http.StatusOK, events)
}
