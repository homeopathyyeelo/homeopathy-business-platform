package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	db interface{}
}

type DashboardStats struct {
	TotalSales       float64 `json:"total_sales"`
	TotalPurchases   float64 `json:"total_purchases"`
	TotalCustomers   int     `json:"total_customers"`
	TotalProducts    int     `json:"total_products"`
	LowStockItems    int     `json:"low_stock_items"`
	ExpiringItems    int     `json:"expiring_items"`
	PendingOrders    int     `json:"pending_orders"`
	TodayRevenue     float64 `json:"today_revenue"`
	MonthRevenue     float64 `json:"month_revenue"`
	YearRevenue      float64 `json:"year_revenue"`
	ActiveUsers      int     `json:"active_users"`
	PendingInvoices  int     `json:"pending_invoices"`
}

type ActivityLog struct {
	ID          string    `json:"id"`
	Action      string    `json:"action"`
	Module      string    `json:"module"`
	Description string    `json:"description"`
	UserName    string    `json:"user_name"`
	UserEmail   string    `json:"user_email"`
	Timestamp   time.Time `json:"timestamp"`
	IPAddress   string    `json:"ip_address"`
	Metadata    string    `json:"metadata"`
}

type RecentSale struct {
	ID           string    `json:"id"`
	InvoiceNo    string    `json:"invoice_no"`
	CustomerName string    `json:"customer_name"`
	Amount       float64   `json:"amount"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

type TopProduct struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	SoldQty     int     `json:"sold_qty"`
	Revenue     float64 `json:"revenue"`
}

type AlertItem struct {
	Type        string    `json:"type"` // low_stock, expiring, pending
	Severity    string    `json:"severity"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ActionURL   string    `json:"action_url"`
	CreatedAt   time.Time `json:"created_at"`
}

func NewDashboardHandler(db interface{}) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// GET /api/erp/dashboard/summary
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	kpis := []gin.H{
		{"label": "Total Sales Today", "value": 54000},
		{"label": "Purchases Today", "value": 32000},
		{"label": "Active Customers", "value": 210},
		{"label": "Pending Orders", "value": 7},
	}

	expirySummary := []gin.H{
		{"window_label": "7d", "count_items": 23},
		{"window_label": "1m", "count_items": 58},
		{"window_label": "3m", "count_items": 142},
	}

	salesSummary := gin.H{
		"today":     54000,
		"yesterday": 50000,
		"month":     1200000,
	}

	c.JSON(http.StatusOK, gin.H{
		"kpis":           kpis,
		"expiry_summary": expirySummary,
		"sales_summary":  salesSummary,
	})
}

// GET /api/erp/system/health
func (h *DashboardHandler) GetSystemHealth(c *gin.Context) {
	services := []struct {
		Name string
		URL  string
	}{
		{"api-golang", "http://localhost:3004/health"},
		{"api-golang-v2", "http://localhost:3005/health"},
		{"purchase-service", "http://localhost:8006/health"},
		{"invoice-parser", "http://localhost:8005/health"},
		{"api-gateway", "http://localhost:4000/health"},
	}

	results := []gin.H{}
	for _, s := range services {
		start := time.Now()
		resp, err := http.Get(s.URL)
		latency := time.Since(start).Milliseconds()
		status := "healthy"
		if err != nil || resp.StatusCode != 200 {
			status = "down"
		}
		if resp != nil {
			resp.Body.Close()
		}
		results = append(results, gin.H{"name": s.Name, "status": status, "latency": latency})
	}
	c.JSON(http.StatusOK, gin.H{"services": results})
}

// GET /api/erp/dashboard/stats
func (h *DashboardHandler) GetStats(c *gin.Context) {
	_ = c.Query("shop_id") // TODO: use for filtering

	// TODO: Query real data from database
	stats := DashboardStats{
		TotalSales:      524750.50,
		TotalPurchases:  328920.00,
		TotalCustomers:  1247,
		TotalProducts:   3892,
		LowStockItems:   23,
		ExpiringItems:   15,
		PendingOrders:   8,
		TodayRevenue:    12450.00,
		MonthRevenue:    245670.00,
		YearRevenue:     2847520.00,
		ActiveUsers:     12,
		PendingInvoices: 5,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GET /api/erp/dashboard/activity
func (h *DashboardHandler) GetActivity(c *gin.Context) {
	_ = c.DefaultQuery("limit", "20") // TODO: implement pagination
	_ = c.Query("module") // TODO: filter by module
	_ = c.Query("user_id") // TODO: filter by user

	// TODO: Query real data from audit_logs table
	now := time.Now()
	activities := []ActivityLog{
		{
			ID:          "act-001",
			Action:      "sale.created",
			Module:      "sales",
			Description: "New sale invoice INV-2024-0123 created",
			UserName:    "John Doe",
			UserEmail:   "john@homeoerp.com",
			Timestamp:   now.Add(-5 * time.Minute),
			IPAddress:   "192.168.1.10",
			Metadata:    `{"invoice_no":"INV-2024-0123","amount":1250.50}`,
		},
		{
			ID:          "act-002",
			Action:      "product.updated",
			Module:      "products",
			Description: "Product SBL Arnica 30C stock updated",
			UserName:    "Jane Smith",
			UserEmail:   "jane@homeoerp.com",
			Timestamp:   now.Add(-15 * time.Minute),
			IPAddress:   "192.168.1.11",
			Metadata:    `{"product_id":"prod-123","old_qty":50,"new_qty":75}`,
		},
		{
			ID:          "act-003",
			Action:      "customer.created",
			Module:      "customers",
			Description: "New customer Rajesh Kumar added",
			UserName:    "Admin User",
			UserEmail:   "admin@homeoerp.com",
			Timestamp:   now.Add(-30 * time.Minute),
			IPAddress:   "192.168.1.5",
			Metadata:    `{"customer_id":"cust-456","name":"Rajesh Kumar"}`,
		},
		{
			ID:          "act-004",
			Action:      "purchase.approved",
			Module:      "purchases",
			Description: "Purchase order PO-2024-0089 approved",
			UserName:    "Manager",
			UserEmail:   "manager@homeoerp.com",
			Timestamp:   now.Add(-45 * time.Minute),
			IPAddress:   "192.168.1.8",
			Metadata:    `{"po_no":"PO-2024-0089","vendor":"SBL","amount":45000}`,
		},
		{
			ID:          "act-005",
			Action:      "user.login",
			Module:      "auth",
			Description: "User logged in successfully",
			UserName:    "John Doe",
			UserEmail:   "john@homeoerp.com",
			Timestamp:   now.Add(-2 * time.Hour),
			IPAddress:   "192.168.1.10",
			Metadata:    `{"device":"Chrome/Windows"}`,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
		"total":   len(activities),
	})
}

// GET /api/erp/dashboard/recent-sales
func (h *DashboardHandler) GetRecentSales(c *gin.Context) {
	_ = c.DefaultQuery("limit", "10") // TODO: implement pagination
	_ = c.Query("shop_id") // TODO: filter by shop

	// TODO: Query real data from sales_invoices table
	now := time.Now()
	sales := []RecentSale{
		{
			ID:           "sale-001",
			InvoiceNo:    "INV-2024-0123",
			CustomerName: "Dr. Sharma",
			Amount:       2450.50,
			Status:       "paid",
			CreatedAt:    now.Add(-10 * time.Minute),
		},
		{
			ID:           "sale-002",
			InvoiceNo:    "INV-2024-0122",
			CustomerName: "Rajesh Pharmacy",
			Amount:       15780.00,
			Status:       "paid",
			CreatedAt:    now.Add(-1 * time.Hour),
		},
		{
			ID:           "sale-003",
			InvoiceNo:    "INV-2024-0121",
			CustomerName: "City Medical Store",
			Amount:       8920.00,
			Status:       "pending",
			CreatedAt:    now.Add(-2 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/dashboard/top-products
func (h *DashboardHandler) GetTopProducts(c *gin.Context) {
	_ = c.DefaultQuery("limit", "10") // TODO: implement pagination
	_ = c.Query("shop_id") // TODO: filter by shop
	_ = c.DefaultQuery("period", "month") // today, week, month, year

	// TODO: Query real data with GROUP BY
	products := []TopProduct{
		{
			ProductID:   "prod-001",
			ProductName: "SBL Arnica Montana 30C",
			SoldQty:     450,
			Revenue:     38250.00,
		},
		{
			ProductID:   "prod-002",
			ProductName: "Reckeweg R1 Drops",
			SoldQty:     285,
			Revenue:     69825.00,
		},
		{
			ProductID:   "prod-003",
			ProductName: "Allen Arsenicum Album 200",
			SoldQty:     320,
			Revenue:     30400.00,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
	})
}

// GET /api/erp/dashboard/alerts
func (h *DashboardHandler) GetAlerts(c *gin.Context) {
	_ = c.Query("shop_id") // TODO: filter by shop

	// TODO: Query from multiple sources (inventory, expiry, orders)
	now := time.Now()
	alerts := []AlertItem{
		{
			Type:        "low_stock",
			Severity:    "high",
			Title:       "Low Stock Alert",
			Description: "23 products are below minimum stock level",
			ActionURL:   "/inventory/low-stock",
			CreatedAt:   now,
		},
		{
			Type:        "expiring",
			Severity:    "critical",
			Title:       "Expiring Soon",
			Description: "15 batches expiring in next 7 days",
			ActionURL:   "/inventory/expiry",
			CreatedAt:   now,
		},
		{
			Type:        "pending",
			Severity:    "medium",
			Title:       "Pending Invoices",
			Description: "5 invoices pending approval",
			ActionURL:   "/purchases/bills",
			CreatedAt:   now,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    alerts,
	})
}

// GET /api/erp/dashboard/revenue-chart
func (h *DashboardHandler) GetRevenueChart(c *gin.Context) {
	_ = c.DefaultQuery("period", "7days") // TODO: implement period filtering

	// TODO: Query real data with date grouping
	chartData := []gin.H{
		{"date": "2024-10-18", "sales": 12450.00, "purchases": 8920.00},
		{"date": "2024-10-19", "sales": 15780.00, "purchases": 11200.00},
		{"date": "2024-10-20", "sales": 10980.00, "purchases": 7500.00},
		{"date": "2024-10-21", "sales": 18240.00, "purchases": 13400.00},
		{"date": "2024-10-22", "sales": 16500.00, "purchases": 10800.00},
		{"date": "2024-10-23", "sales": 14320.00, "purchases": 9200.00},
		{"date": "2024-10-24", "sales": 19870.00, "purchases": 14500.00},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    chartData,
	})
}
