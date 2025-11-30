package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CustomerAnalyticsHandler struct {
	db *gorm.DB
}

func NewCustomerAnalyticsHandler(db *gorm.DB) *CustomerAnalyticsHandler {
	return &CustomerAnalyticsHandler{db: db}
}

// Customer Profile with AI Insights
type CustomerProfile struct {
	ID              string               `json:"id"`
	Name            string               `json:"name"`
	Phone           string               `json:"phone"`
	Email           string               `json:"email"`
	GSTIN           string               `json:"gstin"`
	TotalBills      int                  `json:"totalBills"`
	TotalSpent      float64              `json:"totalSpent"`
	Outstanding     float64              `json:"outstanding"`
	CreditLimit     float64              `json:"creditLimit"`
	LastVisit       *time.Time           `json:"lastVisit"`
	AvgBillValue    float64              `json:"avgBillValue"`
	TopProducts     []CustomerTopProduct `json:"topProducts"`
	VisitPattern    VisitPattern         `json:"visitPattern"`
	PaymentBehavior PaymentBehavior      `json:"paymentBehavior"`
	AIInsights      []string             `json:"aiInsights"`
	RiskScore       string               `json:"riskScore"`
	LoyaltyPoints   int                  `json:"loyaltyPoints"`
	CustomerType    string               `json:"customerType"`
}

type CustomerTopProduct struct {
	ProductID    string  `json:"productId"`
	ProductName  string  `json:"productName"`
	TimesOrdered int     `json:"timesOrdered"`
	TotalSpent   float64 `json:"totalSpent"`
}

type VisitPattern struct {
	PreferredDay     string `json:"preferredDay"`
	PreferredTime    string `json:"preferredTime"`
	AvgDaysBetween   int    `json:"avgDaysBetween"`
	LastVisitDaysAgo int    `json:"lastVisitDaysAgo"`
}

type PaymentBehavior struct {
	PreferredMethod   string  `json:"preferredMethod"`
	AvgPaymentDelay   int     `json:"avgPaymentDelay"`
	CreditUtilization float64 `json:"creditUtilization"`
}

// GET /api/erp/customers/:id/profile
func (h *CustomerAnalyticsHandler) GetCustomerProfile(c *gin.Context) {
	customerID := c.Param("id")

	// Get customer basic info
	var customer struct {
		ID           string
		Name         string
		Phone        string
		Email        string
		GSTIN        string
		CreditLimit  float64
		CustomerType string
	}

	err := h.db.Table("customers").
		Select("id, name, phone, email, gstin, credit_limit, customer_type").
		Where("id = ?", customerID).
		First(&customer).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	// Get billing statistics
	var stats struct {
		TotalBills  int
		TotalSpent  float64
		Outstanding float64
		LastVisit   *time.Time
	}

	h.db.Raw(`
		SELECT 
			COUNT(*) as total_bills,
			COALESCE(SUM(grand_total), 0) as total_spent,
			COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN grand_total ELSE 0 END), 0) as outstanding,
			MAX(invoice_date) as last_visit
		FROM sales_invoices
		WHERE customer_id = ?
	`, customerID).Scan(&stats)

	avgBillValue := float64(0)
	if stats.TotalBills > 0 {
		avgBillValue = stats.TotalSpent / float64(stats.TotalBills)
	}

	// Get top products
	var topProducts []CustomerTopProduct
	h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			COUNT(*) as times_ordered,
			SUM(sii.total) as total_spent
		FROM sales_invoice_items sii
		JOIN sales_invoices si ON si.id = sii.invoice_id
		JOIN products p ON p.id = sii.product_id
		WHERE si.customer_id = ?
		GROUP BY p.id, p.name
		ORDER BY times_ordered DESC
		LIMIT 5
	`, customerID).Scan(&topProducts)

	// Calculate visit pattern
	var visitDays []struct {
		DayOfWeek int
		Count     int
	}
	h.db.Raw(`
		SELECT EXTRACT(DOW FROM invoice_date) as day_of_week, COUNT(*) as count
		FROM sales_invoices
		WHERE customer_id = ?
		GROUP BY day_of_week
		ORDER BY count DESC
		LIMIT 1
	`, customerID).Scan(&visitDays)

	preferredDay := "N/A"
	if len(visitDays) > 0 {
		days := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
		preferredDay = days[visitDays[0].DayOfWeek]
	}

	// Calculate days since last visit
	lastVisitDaysAgo := 0
	if stats.LastVisit != nil {
		lastVisitDaysAgo = int(time.Since(*stats.LastVisit).Hours() / 24)
	}

	visitPattern := VisitPattern{
		PreferredDay:     preferredDay,
		PreferredTime:    "Morning", // TODO: Calculate from actual data
		AvgDaysBetween:   30,        // TODO: Calculate
		LastVisitDaysAgo: lastVisitDaysAgo,
	}

	// Payment behavior
	paymentBehavior := PaymentBehavior{
		PreferredMethod:   "Cash", // TODO: Get from actual data
		AvgPaymentDelay:   0,
		CreditUtilization: (stats.Outstanding / customer.CreditLimit) * 100,
	}

	// Generate AI insights
	aiInsights := []string{}

	if stats.TotalBills > 10 {
		aiInsights = append(aiInsights, "✅ Loyal customer with "+string(rune(stats.TotalBills))+" orders")
	}

	if lastVisitDaysAgo > 60 {
		aiInsights = append(aiInsights, "⚠️ Customer inactive for "+string(rune(lastVisitDaysAgo))+" days - Consider follow-up")
	}

	if stats.Outstanding > 0 {
		aiInsights = append(aiInsights, "💳 Outstanding balance: ₹"+string(rune(int(stats.Outstanding)))+" - Send payment reminder")
	}

	if len(topProducts) > 0 {
		aiInsights = append(aiInsights, "🎯 Frequently buys "+topProducts[0].ProductName+" - Offer combo deals")
	}

	if avgBillValue > 500 {
		aiInsights = append(aiInsights, "💰 High-value customer (Avg: ₹"+string(rune(int(avgBillValue)))+") - VIP treatment recommended")
	}

	// Risk score
	riskScore := "LOW"
	if stats.Outstanding > customer.CreditLimit*0.8 {
		riskScore = "HIGH"
	} else if stats.Outstanding > customer.CreditLimit*0.5 {
		riskScore = "MEDIUM"
	}

	profile := CustomerProfile{
		ID:              customer.ID,
		Name:            customer.Name,
		Phone:           customer.Phone,
		Email:           customer.Email,
		GSTIN:           customer.GSTIN,
		TotalBills:      stats.TotalBills,
		TotalSpent:      stats.TotalSpent,
		Outstanding:     stats.Outstanding,
		CreditLimit:     customer.CreditLimit,
		LastVisit:       stats.LastVisit,
		AvgBillValue:    avgBillValue,
		TopProducts:     topProducts,
		VisitPattern:    visitPattern,
		PaymentBehavior: paymentBehavior,
		AIInsights:      aiInsights,
		RiskScore:       riskScore,
		LoyaltyPoints:   0, // TODO: Calculate
		CustomerType:    customer.CustomerType,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    profile,
	})
}

// GET /api/erp/customers/:id/bills
func (h *CustomerAnalyticsHandler) GetCustomerBills(c *gin.Context) {
	customerID := c.Param("id")
	status := c.Query("status") // all, paid, pending

	query := h.db.Table("sales_invoices").
		Where("customer_id = ?", customerID).
		Order("invoice_date DESC")

	if status == "pending" {
		query = query.Where("payment_status = ?", "PENDING")
	} else if status == "paid" {
		query = query.Where("payment_status = ?", "PAID")
	}

	var bills []map[string]interface{}
	query.Find(&bills)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bills,
	})
}

// GET /api/erp/customers/:id/products
func (h *CustomerAnalyticsHandler) GetCustomerProducts(c *gin.Context) {
	customerID := c.Param("id")

	var products []struct {
		ProductID         string    `json:"productId"`
		ProductName       string    `json:"productName"`
		LastPurchased     time.Time `json:"lastPurchased"`
		TotalQuantity     int       `json:"totalQuantity"`
		TotalSpent        float64   `json:"totalSpent"`
		AvgPrice          float64   `json:"avgPrice"`
		PurchaseFrequency int       `json:"purchaseFrequency"`
	}

	h.db.Raw(`
		SELECT 
			p.id as product_id,
			p.name as product_name,
			MAX(si.invoice_date) as last_purchased,
			SUM(sii.quantity) as total_quantity,
			SUM(sii.total) as total_spent,
			AVG(sii.unit_price) as avg_price,
			COUNT(DISTINCT si.id) as purchase_frequency
		FROM sales_invoice_items sii
		JOIN sales_invoices si ON si.id = sii.invoice_id
		JOIN products p ON p.id = sii.product_id
		WHERE si.customer_id = ?
		GROUP BY p.id, p.name
		ORDER BY purchase_frequency DESC, total_spent DESC
	`, customerID).Scan(&products)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
	})
}

// GET /api/erp/customers/outstanding
func (h *CustomerAnalyticsHandler) GetOutstandingCustomers(c *gin.Context) {
	var customers []struct {
		CustomerID   string     `json:"customerId"`
		CustomerName string     `json:"customerName"`
		Phone        string     `json:"phone"`
		Outstanding  float64    `json:"outstanding"`
		CreditLimit  float64    `json:"creditLimit"`
		DaysOverdue  int        `json:"daysOverdue"`
		LastPayment  *time.Time `json:"lastPayment"`
	}

	h.db.Raw(`
		SELECT 
			c.id as customer_id,
			c.name as customer_name,
			c.phone,
			COALESCE(SUM(si.grand_total), 0) as outstanding,
			c.credit_limit,
			COALESCE(MAX(EXTRACT(DAY FROM NOW() - si.invoice_date)), 0) as days_overdue,
			MAX(si.invoice_date) as last_payment
		FROM customers c
		LEFT JOIN sales_invoices si ON si.customer_id = c.id AND si.payment_status = 'PENDING'
		GROUP BY c.id, c.name, c.phone, c.credit_limit
		HAVING COALESCE(SUM(si.grand_total), 0) > 0
		ORDER BY outstanding DESC
	`).Scan(&customers)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    customers,
	})
}

// POST /api/erp/customers/:id/loyalty/add
func (h *CustomerAnalyticsHandler) AddLoyaltyPoints(c *gin.Context) {
	_ = c.Param("id") // TODO: Use for loyalty implementation

	var req struct {
		Points int    `json:"points"`
		Reason string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement loyalty points logic

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Loyalty points added",
	})
}

// GET /api/erp/customers/analytics/summary
func (h *CustomerAnalyticsHandler) GetCustomerAnalyticsSummary(c *gin.Context) {
	var summary struct {
		TotalCustomers   int     `json:"totalCustomers"`
		ActiveCustomers  int     `json:"activeCustomers"`
		NewThisMonth     int     `json:"newThisMonth"`
		TotalOutstanding float64 `json:"totalOutstanding"`
		AvgLifetimeValue float64 `json:"avgLifetimeValue"`
		TopCustomers     []struct {
			Name       string  `json:"name"`
			TotalSpent float64 `json:"totalSpent"`
		} `json:"topCustomers"`
	}

	h.db.Raw("SELECT COUNT(*) FROM customers").Scan(&summary.TotalCustomers)
	h.db.Raw("SELECT COUNT(DISTINCT customer_id) FROM sales_invoices WHERE invoice_date > NOW() - INTERVAL '30 days'").Scan(&summary.ActiveCustomers)
	h.db.Raw("SELECT COUNT(*) FROM customers WHERE created_at > NOW() - INTERVAL '30 days'").Scan(&summary.NewThisMonth)
	h.db.Raw("SELECT COALESCE(SUM(grand_total), 0) FROM sales_invoices WHERE payment_status = 'PENDING'").Scan(&summary.TotalOutstanding)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}
