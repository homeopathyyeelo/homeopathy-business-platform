package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HomeopathyDashboardHandler - Analytics and dashboard handler
type HomeopathyDashboardHandler struct {
	db *gorm.DB
}

func NewHomeopathyDashboardHandler(db *gorm.DB) *HomeopathyDashboardHandler {
	return &HomeopathyDashboardHandler{db: db}
}

// HomeopathyDashboardStats comprehensive dashboard statistics
type HomeopathyDashboardStats struct {
	// Sales Stats
	TodaySales        float64 `json:"todaySales"`
	YesterdaySales    float64 `json:"yesterdaySales"`
	MonthSales        float64 `json:"monthSales"`
	YearSales         float64 `json:"yearSales"`
	SalesGrowth       float64 `json:"salesGrowth"`
	
	// Order Stats
	TodayOrders       int     `json:"todayOrders"`
	PendingOrders     int     `json:"pendingOrders"`
	CompletedOrders   int     `json:"completedOrders"`
	CancelledOrders   int     `json:"cancelledOrders"`
	AverageOrderValue float64 `json:"averageOrderValue"`
	
	// Inventory Stats
	TotalProducts     int     `json:"totalProducts"`
	LowStockProducts  int     `json:"lowStockProducts"`
	OutOfStockProducts int    `json:"outOfStockProducts"`
	ExpiringProducts  int     `json:"expiringProducts"`
	TotalInventoryValue float64 `json:"totalInventoryValue"`
	
	// Customer Stats
	TotalCustomers    int     `json:"totalCustomers"`
	ActiveCustomers   int     `json:"activeCustomers"`
	NewCustomersToday int     `json:"newCustomersToday"`
	NewCustomersMonth int     `json:"newCustomersMonth"`
	
	// Payment Stats
	TotalReceivables  float64 `json:"totalReceivables"`
	TotalPayables     float64 `json:"totalPayables"`
	CashSalesToday    float64 `json:"cashSalesToday"`
	CreditSalesToday  float64 `json:"creditSalesToday"`
}

// GET /api/homeopathy/dashboard/stats - Get comprehensive dashboard statistics
func (h *HomeopathyDashboardHandler) GetDashboardStats(c *gin.Context) {
	var stats HomeopathyDashboardStats

	// Today's sales
	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM sales_orders 
		WHERE DATE(created_at) = CURRENT_DATE AND status != 'CANCELLED'
	`).Scan(&stats.TodaySales)

	// Yesterday's sales
	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM sales_orders 
		WHERE DATE(created_at) = CURRENT_DATE - 1 AND status != 'CANCELLED'
	`).Scan(&stats.YesterdaySales)

	// Calculate growth
	if stats.YesterdaySales > 0 {
		stats.SalesGrowth = ((stats.TodaySales - stats.YesterdaySales) / stats.YesterdaySales) * 100
	}

	// Month sales
	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM sales_orders 
		WHERE DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE) AND status != 'CANCELLED'
	`).Scan(&stats.MonthSales)

	// Year sales
	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM sales_orders 
		WHERE DATE(created_at) >= DATE_TRUNC('year', CURRENT_DATE) AND status != 'CANCELLED'
	`).Scan(&stats.YearSales)

	// Order stats
	var todayOrders, pendingOrders, completedOrders, cancelledOrders int64
	h.db.Table("sales_orders").Where("DATE(created_at) = CURRENT_DATE").Count(&todayOrders)
	h.db.Table("sales_orders").Where("status IN ('draft', 'PENDING')").Count(&pendingOrders)
	h.db.Table("sales_orders").Where("status IN ('COMPLETED', 'DELIVERED')").Count(&completedOrders)
	h.db.Table("sales_orders").Where("status = 'CANCELLED'").Count(&cancelledOrders)
	
	stats.TodayOrders = int(todayOrders)
	stats.PendingOrders = int(pendingOrders)
	stats.CompletedOrders = int(completedOrders)
	stats.CancelledOrders = int(cancelledOrders)

	// Average order value (last 30 days)
	h.db.Raw(`
		SELECT COALESCE(AVG(total_amount), 0) 
		FROM sales_orders 
		WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'CANCELLED'
	`).Scan(&stats.AverageOrderValue)

	// Inventory stats
	var totalProducts, lowStockProducts, outOfStockProducts, expiringProducts int64
	h.db.Table("products").Where("is_active = ?", true).Count(&totalProducts)
	h.db.Table("products").Where("is_active = ? AND current_stock <= reorder_level", true).Count(&lowStockProducts)
	h.db.Table("products").Where("is_active = ? AND current_stock = 0", true).Count(&outOfStockProducts)
	
	stats.TotalProducts = int(totalProducts)
	stats.LowStockProducts = int(lowStockProducts)
	stats.OutOfStockProducts = int(outOfStockProducts)

	// Expiring products (next 30 days)
	h.db.Raw(`
		SELECT COUNT(DISTINCT product_id) 
		FROM inventory_batches 
		WHERE expiry_date IS NOT NULL 
		AND expiry_date <= NOW() + INTERVAL '30 days'
		AND expiry_date >= NOW()
		AND is_active = true
	`).Scan(&expiringProducts)
	stats.ExpiringProducts = int(expiringProducts)

	// Total inventory value
	h.db.Raw(`
		SELECT COALESCE(SUM(available_quantity * unit_cost), 0) 
		FROM inventory_batches 
		WHERE is_active = true
	`).Scan(&stats.TotalInventoryValue)

	// Customer stats
	var totalCustomers, activeCustomers, newCustomersToday, newCustomersMonth int64
	h.db.Table("customers").Where("is_active = ?", true).Count(&totalCustomers)
	h.db.Table("customers").Where("DATE(created_at) = CURRENT_DATE").Count(&newCustomersToday)
	h.db.Table("customers").Where("DATE(created_at) >= DATE_TRUNC('month', CURRENT_DATE)").Count(&newCustomersMonth)
	
	// Active customers (who made purchase in last 90 days)
	h.db.Raw(`
		SELECT COUNT(DISTINCT customer_id) 
		FROM sales_orders 
		WHERE created_at >= NOW() - INTERVAL '90 days'
	`).Scan(&activeCustomers)
	
	stats.TotalCustomers = int(totalCustomers)
	stats.ActiveCustomers = int(activeCustomers)
	stats.NewCustomersToday = int(newCustomersToday)
	stats.NewCustomersMonth = int(newCustomersMonth)

	// Payment stats
	h.db.Raw(`
		SELECT COALESCE(SUM(balance_amount), 0) 
		FROM sales_orders 
		WHERE status != 'CANCELLED' AND balance_amount > 0
	`).Scan(&stats.TotalReceivables)

	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount - paid_amount), 0) 
		FROM purchase_orders 
		WHERE status != 'CANCELLED'
	`).Scan(&stats.TotalPayables)

	// Cash vs Credit sales today
	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM sales_orders 
		WHERE DATE(created_at) = CURRENT_DATE 
		AND payment_method IN ('CASH', 'CARD', 'UPI')
		AND status != 'CANCELLED'
	`).Scan(&stats.CashSalesToday)

	h.db.Raw(`
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM sales_orders 
		WHERE DATE(created_at) = CURRENT_DATE 
		AND payment_method = 'CREDIT'
		AND status != 'CANCELLED'
	`).Scan(&stats.CreditSalesToday)

	c.JSON(http.StatusOK, stats)
}

// TopSellingProduct for analytics
type TopSellingProduct struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	SKU          string  `json:"sku"`
	CategoryName string  `json:"categoryName"`
	BrandName    string  `json:"brandName"`
	PotencyName  string  `json:"potencyName"`
	TotalSold    float64 `json:"totalSold"`
	TotalRevenue float64 `json:"totalRevenue"`
	OrderCount   int     `json:"orderCount"`
}

// GET /api/homeopathy/dashboard/top-products - Get top selling products
func (h *HomeopathyDashboardHandler) GetTopProducts(c *gin.Context) {
	days := c.DefaultQuery("days", "30")
	limit := c.DefaultQuery("limit", "10")

	var products []TopSellingProduct
	h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			c.name as category_name,
			b.name as brand_name,
			pot.name as potency_name,
			SUM(soi.quantity) as total_sold,
			SUM(soi.total_amount) as total_revenue,
			COUNT(DISTINCT soi.sales_order_id) as order_count
		FROM sales_order_items soi
		JOIN products p ON soi.product_id = p.id
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN brands b ON p.brand_id = b.id
		LEFT JOIN potencies pot ON p.potency_id = pot.id
		JOIN sales_orders so ON soi.sales_order_id = so.id
		WHERE so.created_at >= NOW() - INTERVAL '? days'
		AND so.status != 'CANCELLED'
		GROUP BY p.id, p.name, p.sku, c.name, b.name, pot.name
		ORDER BY total_sold DESC
		LIMIT ?
	`, days, limit).Scan(&products)

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"total":    len(products),
	})
}

// SalesChart data for charting
type SalesChartData struct {
	Date   string  `json:"date"`
	Sales  float64 `json:"sales"`
	Orders int     `json:"orders"`
}

// GET /api/homeopathy/dashboard/sales-chart - Get sales chart data
func (h *HomeopathyDashboardHandler) GetSalesChart(c *gin.Context) {
	days := c.DefaultQuery("days", "7")

	var chartData []SalesChartData
	h.db.Raw(`
		SELECT 
			TO_CHAR(created_at, 'YYYY-MM-DD') as date,
			COALESCE(SUM(total_amount), 0) as sales,
			COUNT(*) as orders
		FROM sales_orders
		WHERE created_at >= NOW() - INTERVAL '? days'
		AND status != 'CANCELLED'
		GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
		ORDER BY date ASC
	`, days).Scan(&chartData)

	c.JSON(http.StatusOK, gin.H{
		"data": chartData,
	})
}

// RecentActivity for activity feed
type RecentActivity struct {
	ID          string    `json:"id"`
	Type        string    `json:"type"` // order, customer, product, payment
	Description string    `json:"description"`
	Amount      float64   `json:"amount"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

// GET /api/homeopathy/dashboard/recent-activity - Get recent activities
func (h *HomeopathyDashboardHandler) GetRecentActivity(c *gin.Context) {
	limit := c.DefaultQuery("limit", "20")

	var activities []RecentActivity
	
	// Recent orders
	h.db.Raw(`
		SELECT 
			so.id,
			'order' as type,
			CONCAT('Order #', so.order_number, ' by ', c.name) as description,
			so.total_amount as amount,
			so.status,
			so.created_at
		FROM sales_orders so
		LEFT JOIN customers c ON so.customer_id = c.id
		WHERE so.created_at >= NOW() - INTERVAL '7 days'
		ORDER BY so.created_at DESC
		LIMIT ?
	`, limit).Scan(&activities)

	c.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"total":      len(activities),
	})
}

// CategorySales for category-wise analysis
type CategorySales struct {
	CategoryID   string  `json:"categoryId"`
	CategoryName string  `json:"categoryName"`
	TotalSales   float64 `json:"totalSales"`
	TotalOrders  int     `json:"totalOrders"`
	ProductCount int     `json:"productCount"`
	Percentage   float64 `json:"percentage"`
}

// GET /api/homeopathy/dashboard/category-sales - Get category-wise sales
func (h *HomeopathyDashboardHandler) GetCategorySales(c *gin.Context) {
	days := c.DefaultQuery("days", "30")

	var categorySales []CategorySales
	h.db.Raw(`
		SELECT 
			c.id as category_id,
			c.name as category_name,
			COALESCE(SUM(soi.total_amount), 0) as total_sales,
			COUNT(DISTINCT soi.sales_order_id) as total_orders,
			COUNT(DISTINCT p.id) as product_count
		FROM categories c
		LEFT JOIN products p ON c.id = p.category_id
		LEFT JOIN sales_order_items soi ON p.id = soi.product_id
		LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
		WHERE (so.created_at >= NOW() - INTERVAL '? days' OR so.created_at IS NULL)
		AND (so.status != 'CANCELLED' OR so.status IS NULL)
		GROUP BY c.id, c.name
		ORDER BY total_sales DESC
	`, days).Scan(&categorySales)

	// Calculate percentages
	var totalSales float64
	for _, cat := range categorySales {
		totalSales += cat.TotalSales
	}
	
	for i := range categorySales {
		if totalSales > 0 {
			categorySales[i].Percentage = (categorySales[i].TotalSales / totalSales) * 100
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categorySales,
		"total":      len(categorySales),
	})
}

// InventoryAlert for stock alerts
type InventoryAlert struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	SKU          string  `json:"sku"`
	CurrentStock float64 `json:"currentStock"`
	MinStock     int     `json:"minStock"`
	AlertType    string  `json:"alertType"` // LOW_STOCK, OUT_OF_STOCK, EXPIRING
	Severity     string  `json:"severity"`  // LOW, MEDIUM, HIGH, CRITICAL
	DaysToExpiry int     `json:"daysToExpiry"`
}

// GET /api/homeopathy/dashboard/inventory-alerts - Get inventory alerts
func (h *HomeopathyDashboardHandler) GetInventoryAlerts(c *gin.Context) {
	var alerts []InventoryAlert

	// Low stock alerts
	h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			p.sku,
			p.current_stock,
			p.min_stock,
			CASE 
				WHEN p.current_stock = 0 THEN 'OUT_OF_STOCK'
				WHEN p.current_stock <= p.min_stock THEN 'LOW_STOCK'
			END as alert_type,
			CASE 
				WHEN p.current_stock = 0 THEN 'CRITICAL'
				WHEN p.current_stock <= p.min_stock * 0.5 THEN 'HIGH'
				ELSE 'MEDIUM'
			END as severity,
			0 as days_to_expiry
		FROM products p
		WHERE p.is_active = true
		AND p.current_stock <= p.reorder_level
		ORDER BY p.current_stock ASC
		LIMIT 50
	`).Scan(&alerts)

	c.JSON(http.StatusOK, gin.H{
		"alerts": alerts,
		"total":  len(alerts),
	})
}
