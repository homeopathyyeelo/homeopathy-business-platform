package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type QuickActionsHandler struct {
	db *gorm.DB
}

func NewQuickActionsHandler(db *gorm.DB) *QuickActionsHandler {
	return &QuickActionsHandler{db: db}
}

// GetQuickActions - GET /api/erp/dashboard/quick-actions
// Returns smart quick actions based on current system state
func (h *QuickActionsHandler) GetQuickActions(c *gin.Context) {
	var actions []map[string]interface{}

	// Check low stock products
	var lowStockCount int64
	h.db.Table("products").Where("current_stock <= min_stock AND min_stock > 0").Count(&lowStockCount)
	if lowStockCount > 0 {
		actions = append(actions, map[string]interface{}{
			"id":          "low_stock",
			"title":       "Low Stock Alert",
			"description": lowStockCount,
			"message":     "products need reordering",
			"action":      "/inventory/low-stock",
			"icon":        "AlertTriangle",
			"color":       "warning",
			"priority":    "high",
		})
	}

	// Check out of stock
	var outOfStockCount int64
	h.db.Table("products").Where("current_stock = 0").Count(&outOfStockCount)
	if outOfStockCount > 0 {
		actions = append(actions, map[string]interface{}{
			"id":          "out_of_stock",
			"title":       "Out of Stock",
			"description": outOfStockCount,
			"message":     "products are out of stock",
			"action":      "/inventory/out-of-stock",
			"icon":        "XCircle",
			"color":       "danger",
			"priority":    "critical",
		})
	}

	// Check pending purchase orders (if table exists)
	var pendingPOCount int64
	if err := h.db.Table("purchase_orders").Where("status = ?", "pending").Count(&pendingPOCount).Error; err == nil && pendingPOCount > 0 {
		actions = append(actions, map[string]interface{}{
			"id":          "pending_po",
			"title":       "Pending Purchase Orders",
			"description": pendingPOCount,
			"message":     "purchase orders need approval",
			"action":      "/purchases/pending",
			"icon":        "FileText",
			"color":       "info",
			"priority":    "medium",
		})
	}

	// Check pending sales orders (if table exists)
	var pendingSalesCount int64
	if err := h.db.Table("sales_orders").Where("status = ?", "pending").Count(&pendingSalesCount).Error; err == nil && pendingSalesCount > 0 {
		actions = append(actions, map[string]interface{}{
			"id":          "pending_sales",
			"title":       "Pending Sales Orders",
			"description": pendingSalesCount,
			"message":     "sales orders to process",
			"action":      "/sales/pending",
			"icon":        "ShoppingCart",
			"color":       "success",
			"priority":    "high",
		})
	}

	// Default actions if nothing urgent
	if len(actions) == 0 {
		actions = append(actions, map[string]interface{}{
			"id":          "all_good",
			"title":       "All Systems Running Smoothly",
			"description": "No urgent actions required",
			"message":     "",
			"action":      "/dashboard",
			"icon":        "CheckCircle",
			"color":       "success",
			"priority":    "low",
		})
	}

	// Always add common quick actions
	actions = append(actions, map[string]interface{}{
		"id":          "add_product",
		"title":       "Add New Product",
		"description": "Quick product entry",
		"message":     "",
		"action":      "/products/new",
		"icon":        "Plus",
		"color":       "primary",
		"priority":    "low",
	})

	actions = append(actions, map[string]interface{}{
		"id":          "create_invoice",
		"title":       "Create Invoice",
		"description": "New sale transaction",
		"message":     "",
		"action":      "/sales/new",
		"icon":        "FileText",
		"color":       "primary",
		"priority":    "low",
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    actions,
		"count":   len(actions),
	})
}
