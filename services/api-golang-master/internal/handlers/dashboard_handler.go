package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

type DashboardStats struct {
	TotalSales      float64 `json:"total_sales"`
	TotalPurchases  float64 `json:"total_purchases"`
	TotalCustomers  int     `json:"total_customers"`
	TotalProducts   int     `json:"total_products"`
	LowStockItems   int     `json:"low_stock_items"`
	ExpiringItems   int     `json:"expiring_items"`
	PendingOrders   int     `json:"pending_orders"`
	TodayRevenue    float64 `json:"today_revenue"`
	MonthRevenue    float64 `json:"month_revenue"`
	YearRevenue     float64 `json:"year_revenue"`
	ActiveUsers     int     `json:"active_users"`
	PendingInvoices int     `json:"pending_invoices"`
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

type QuickAction struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Link        string `json:"link"`
	Priority    string `json:"priority"`
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
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
		{"api-golang", "http://localhost:3005/health"},
		{"api-golang-master", "http://localhost:3005/health"},
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
	var stats DashboardStats

	// Real sales query
	h.db.Table("sales_invoices").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalSales)

	// Real purchases query
	h.db.Table("purchase_orders").Where("status = 'COMPLETED'").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalPurchases)

	// Real customers count
	var customerCount int64
	h.db.Table("customers").Where("is_active = true").Count(&customerCount)
	stats.TotalCustomers = int(customerCount)

	// Real products count
	var productCount int64
	h.db.Table("products").Where("is_active = true").Count(&productCount)
	stats.TotalProducts = int(productCount)

	// Low stock items
	h.db.Raw(`SELECT COUNT(*) FROM (SELECT p.id FROM products p LEFT JOIN inventory_batches ib ON ib.product_id = p.id WHERE p.is_active = true GROUP BY p.id, p.min_stock_level HAVING COALESCE(SUM(ib.available_quantity), 0) < p.min_stock_level) as low_stock`).Scan(&stats.LowStockItems)

	// Expiring items (next 90 days)
	h.db.Raw(`SELECT COUNT(DISTINCT ib.id) FROM inventory_batches ib WHERE ib.expiry_date IS NOT NULL AND ib.expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND ib.expiry_date >= CURRENT_DATE AND ib.available_quantity > 0 AND ib.is_active = true`).Scan(&stats.ExpiringItems)

	// Pending orders
	h.db.Table("sales_orders").Where("status = 'PENDING'").Count(&customerCount)
	stats.PendingOrders = int(customerCount)

	// Today revenue
	h.db.Table("sales_invoices").Where("DATE(created_at) = CURRENT_DATE").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TodayRevenue)

	// Month revenue
	h.db.Table("sales_invoices").Where("EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.MonthRevenue)

	// Year revenue
	h.db.Table("sales_invoices").Where("EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.YearRevenue)

	// Active users
	h.db.Table("users").Where("is_active = true").Count(&customerCount)
	stats.ActiveUsers = int(customerCount)

	// Pending invoices
	h.db.Table("sales_invoices").Where("payment_status = 'PENDING'").Count(&customerCount)
	stats.PendingInvoices = int(customerCount)

	c.JSON(http.StatusOK, gin.H{
		"data":    stats,
		"success": true,
	})
}

// GET /api/erp/dashboard/activity
func (h *DashboardHandler) GetActivity(c *gin.Context) {
	_ = c.DefaultQuery("limit", "20") // TODO: implement pagination
	_ = c.Query("module")             // TODO: filter by module
	_ = c.Query("user_id")            // TODO: filter by user

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
	limit := c.DefaultQuery("limit", "10")

	var sales []RecentSale

	// Query recent sales from database
	h.db.Raw(`
		SELECT 
			si.id,
			si.invoice_no,
			COALESCE(c.name, 'Walk-in Customer') as customer_name,
			si.total_amount as amount,
			LOWER(si.payment_status) as status,
			si.created_at
		FROM sales_invoices si
		LEFT JOIN customers c ON c.id = si.customer_id
		ORDER BY si.created_at DESC
		LIMIT ?
	`, limit).Scan(&sales)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/dashboard/top-products
func (h *DashboardHandler) GetTopProducts(c *gin.Context) {
	limit := c.DefaultQuery("limit", "10")
	period := c.DefaultQuery("period", "month") // today, week, month, year

	// Determine date filter
	var dateFilter string
	switch period {
	case "today":
		dateFilter = "DATE(si.created_at) = CURRENT_DATE"
	case "week":
		dateFilter = "si.created_at >= CURRENT_DATE - INTERVAL '7 days'"
	case "month":
		dateFilter = "si.created_at >= CURRENT_DATE - INTERVAL '30 days'"
	case "year":
		dateFilter = "si.created_at >= CURRENT_DATE - INTERVAL '365 days'"
	default:
		dateFilter = "si.created_at >= CURRENT_DATE - INTERVAL '30 days'"
	}

	var products []TopProduct

	// Query top products by revenue from sales
	h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			COALESCE(SUM(sii.quantity), 0)::int as sold_qty,
			COALESCE(SUM(sii.quantity * sii.unit_price), 0) as revenue
		FROM products p
		LEFT JOIN sales_invoice_items sii ON sii.product_id = p.id
		LEFT JOIN sales_invoices si ON si.id = sii.sales_invoice_id
		WHERE `+dateFilter+`
			AND p.is_active = true
		GROUP BY p.id, p.name
		HAVING SUM(sii.quantity) > 0
		ORDER BY revenue DESC
		LIMIT ?
	`, limit).Scan(&products)

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
	period := c.DefaultQuery("period", "7days")

	// Determine date range based on period
	var daysBack int
	switch period {
	case "7days":
		daysBack = 7
	case "30days", "month":
		daysBack = 30
	case "90days", "3months":
		daysBack = 90
	case "6months", "6m":
		daysBack = 180
	default:
		daysBack = 7
	}

	// Query real sales data grouped by date
	type ChartData struct {
		Date      string  `json:"month"` // Using 'month' key for compatibility
		Sales     float64 `json:"sales"`
		Purchases float64 `json:"purchases"`
	}

	var chartData []ChartData

	// Sales data grouped by date
	h.db.Raw(`
		SELECT 
			TO_CHAR(created_at::date, 'YYYY-MM-DD') as date,
			COALESCE(SUM(total_amount), 0) as sales
		FROM sales_invoices
		WHERE created_at >= CURRENT_DATE - INTERVAL '? days'
		GROUP BY created_at::date
		ORDER BY date ASC
	`, daysBack).Scan(&chartData)

	// Get purchases data and merge
	type PurchaseData struct {
		Date      string
		Purchases float64
	}
	var purchaseData []PurchaseData
	h.db.Raw(`
		SELECT 
			TO_CHAR(created_at::date, 'YYYY-MM-DD') as date,
			COALESCE(SUM(total_amount), 0) as purchases
		FROM purchase_orders
		WHERE created_at >= CURRENT_DATE - INTERVAL '? days'
			AND status = 'COMPLETED'
		GROUP BY created_at::date
		ORDER BY date ASC
	`, daysBack).Scan(&purchaseData)

	// Merge purchase data into chart data
	purchaseMap := make(map[string]float64)
	for _, p := range purchaseData {
		purchaseMap[p.Date] = p.Purchases
	}

	for i := range chartData {
		if purchases, ok := purchaseMap[chartData[i].Date]; ok {
			chartData[i].Purchases = purchases
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    chartData,
	})
}

// GET /api/erp/dashboard/expiry-summary
func (h *DashboardHandler) GetExpirySummary(c *gin.Context) {
	summary := gin.H{
		"expired":        12,
		"expiring7Days":  23,
		"expiring30Days": 58,
		"expiring90Days": 142,
		"alerts": []gin.H{
			{
				"productName": "Arnica Montana 30C",
				"batchNo":     "BATCH-2024-001",
				"expiryDate":  time.Now().AddDate(0, 1, 15).Format("2006-01-02"),
				"daysLeft":    45,
				"quantity":    25,
				"severity":    "warning",
			},
			{
				"productName": "Calendula MT",
				"batchNo":     "BATCH-2024-045",
				"expiryDate":  time.Now().AddDate(0, 0, 20).Format("2006-01-02"),
				"daysLeft":    20,
				"quantity":    12,
				"severity":    "critical",
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

// GetAIBusinessInsights returns AI-powered business insights
func (h *DashboardHandler) GetAIBusinessInsights(c *gin.Context) {
	// Call AI service for business insights
	endpoint := "/v2/analytics/business-insights"
	aiResponse, err := callAIService(endpoint, map[string]interface{}{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "AI service unavailable: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"insights":     aiResponse,
		"generated_at": time.Now(),
	})
}
