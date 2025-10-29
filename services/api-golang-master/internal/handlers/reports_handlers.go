// Reports Handlers - Complete implementation for sales, inventory, purchase, and financial reports
package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ReportsHandler handles all reporting and analytics operations
type ReportsHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewReportsHandler creates a new reports handler
func NewReportsHandler(db *GORMDatabase, cache *CacheService) *ReportsHandler {
	return &ReportsHandler{db: db, cache: cache}
}

// ==================== SALES REPORTS ====================

// GetDailySalesReport retrieves daily sales report
func (h *ReportsHandler) GetDailySalesReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	date := c.Query("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	var report map[string]interface{}

	query := `
		SELECT
			COUNT(*) as invoice_count,
			COALESCE(SUM(total_amount), 0) as total_sales,
			COALESCE(SUM(paid_amount), 0) as total_paid,
			COALESCE(SUM(outstanding_amount), 0) as total_outstanding,
			COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_invoices,
			COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
		FROM invoices
		WHERE DATE(invoice_date) = ? AND is_active = true
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, date).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate daily sales report"})
		return
	}

	report["date"] = date
	c.JSON(http.StatusOK, report)
}

// GetWeeklySalesReport retrieves weekly sales report
func (h *ReportsHandler) GetWeeklySalesReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	weekStart := c.Query("week_start")
	if weekStart == "" {
		// Default to current week
		now := time.Now()
		weekday := int(now.Weekday())
		weekStart = now.AddDate(0, 0, -weekday+1).Format("2006-01-02")
	}

	startDate, err := time.Parse("2006-01-02", weekStart)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid week_start format"})
		return
	}

	endDate := startDate.AddDate(0, 0, 6)

	var report []map[string]interface{}

	query := `
		SELECT
			DATE(invoice_date) as date,
			COUNT(*) as invoice_count,
			COALESCE(SUM(total_amount), 0) as total_sales,
			COALESCE(SUM(paid_amount), 0) as total_paid,
			COALESCE(SUM(outstanding_amount), 0) as total_outstanding
		FROM invoices
		WHERE invoice_date BETWEEN ? AND ? AND is_active = true
		GROUP BY DATE(invoice_date)
		ORDER BY date
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate weekly sales report"})
		return
	}

	response := map[string]interface{}{
		"week_start":  weekStart,
		"week_end":    endDate.Format("2006-01-02"),
		"daily_data":  report,
		"total_sales": calculateTotal(report, "total_sales"),
		"total_paid":  calculateTotal(report, "total_paid"),
	}

	c.JSON(http.StatusOK, response)
}

// GetMonthlySalesReport retrieves monthly sales report
func (h *ReportsHandler) GetMonthlySalesReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	year := c.Query("year")
	month := c.Query("month")

	if year == "" {
		year = fmt.Sprintf("%d", time.Now().Year())
	}
	if month == "" {
		month = fmt.Sprintf("%d", int(time.Now().Month()))
	}

	yearInt, _ := strconv.Atoi(year)
	monthInt, _ := strconv.Atoi(month)

	startDate := time.Date(yearInt, time.Month(monthInt), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).AddDate(0, 0, -1)

	var report []map[string]interface{}

	query := `
		SELECT
			DATE(invoice_date) as date,
			COUNT(*) as invoice_count,
			COALESCE(SUM(total_amount), 0) as total_sales,
			COALESCE(SUM(paid_amount), 0) as total_paid,
			COALESCE(SUM(outstanding_amount), 0) as total_outstanding
		FROM invoices
		WHERE invoice_date BETWEEN ? AND ? AND is_active = true
		GROUP BY DATE(invoice_date)
		ORDER BY date
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate monthly sales report"})
		return
	}

	response := map[string]interface{}{
		"year":        year,
		"month":       month,
		"start_date":  startDate.Format("2006-01-02"),
		"end_date":    endDate.Format("2006-01-02"),
		"daily_data":  report,
		"total_sales": calculateTotal(report, "total_sales"),
		"total_paid":  calculateTotal(report, "total_paid"),
	}

	c.JSON(http.StatusOK, response)
}

// GetProductWiseSales retrieves product-wise sales analysis
func (h *ReportsHandler) GetProductWiseSales(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			p.id,
			p.name as product_name,
			p.product_code,
			SUM(ii.quantity) as total_quantity,
			COUNT(DISTINCT i.id) as invoice_count,
			COALESCE(SUM(ii.total_amount), 0) as total_sales,
			AVG(ii.unit_price) as avg_unit_price
		FROM products p
		JOIN invoice_items ii ON p.id = ii.product_id
		JOIN invoices i ON ii.invoice_id = i.id
		WHERE i.invoice_date BETWEEN ? AND ? AND i.is_active = true AND p.is_active = true
		GROUP BY p.id, p.name, p.product_code
		ORDER BY total_sales DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate product-wise sales report"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"products":   report,
		"total_products": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// GetCustomerWiseSales retrieves customer-wise sales analysis
func (h *ReportsHandler) GetCustomerWiseSales(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			c.id,
			c.name as customer_name,
			c.phone,
			COUNT(i.id) as invoice_count,
			COALESCE(SUM(i.total_amount), 0) as total_sales,
			COALESCE(SUM(i.paid_amount), 0) as total_paid,
			COALESCE(SUM(i.outstanding_amount), 0) as outstanding_amount,
			MAX(i.invoice_date) as last_purchase_date
		FROM customers c
		JOIN invoices i ON c.id = i.customer_id
		WHERE i.invoice_date BETWEEN ? AND ? AND i.is_active = true AND c.is_active = true
		GROUP BY c.id, c.name, c.phone
		ORDER BY total_sales DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate customer-wise sales report"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"customers":  report,
		"total_customers": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// GetSalesmanPerformance retrieves salesman performance report
func (h *ReportsHandler) GetSalesmanPerformance(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			u.id,
			u.first_name || ' ' || u.last_name as salesman_name,
			COUNT(i.id) as invoice_count,
			COALESCE(SUM(i.total_amount), 0) as total_sales,
			COALESCE(SUM(i.paid_amount), 0) as total_paid,
			COALESCE(SUM(i.outstanding_amount), 0) as outstanding_amount,
			COALESCE(SUM(sc.commission_amount), 0) as total_commission
		FROM users u
		JOIN invoices i ON u.id = i.salesman_id
		LEFT JOIN salesman_commissions sc ON i.id = sc.invoice_id AND sc.status = 'approved'
		WHERE i.invoice_date BETWEEN ? AND ? AND i.is_active = true AND u.is_active = true
		GROUP BY u.id, u.first_name, u.last_name
		ORDER BY total_sales DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate salesman performance report"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"salesmen":   report,
		"total_salesmen": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== INVENTORY REPORTS ====================

// GetStockSummary retrieves inventory stock summary
func (h *ReportsHandler) GetStockSummary(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var summary []map[string]interface{}

	query := `
		SELECT
			p.id,
			p.name as product_name,
			p.product_code,
			COALESCE(SUM(CASE WHEN il.transaction_type = 'in' THEN il.quantity ELSE 0 END), 0) -
			COALESCE(SUM(CASE WHEN il.transaction_type = 'out' THEN il.quantity ELSE 0 END), 0) as current_stock,
			p.min_stock_level,
			p.max_stock_level,
			CASE WHEN p.min_stock_level > 0 AND
				(COALESCE(SUM(CASE WHEN il.transaction_type = 'in' THEN il.quantity ELSE 0 END), 0) -
				 COALESCE(SUM(CASE WHEN il.transaction_type = 'out' THEN il.quantity ELSE 0 END), 0)) <= p.min_stock_level
			THEN true ELSE false END as is_low_stock,
			p.retail_price,
			(p.retail_price * (COALESCE(SUM(CASE WHEN il.transaction_type = 'in' THEN il.quantity ELSE 0 END), 0) -
			 COALESCE(SUM(CASE WHEN il.transaction_type = 'out' THEN il.quantity ELSE 0 END), 0))) as inventory_value
		FROM products p
		LEFT JOIN inventory_levels il ON p.id = il.product_id AND il.is_active = true
		WHERE p.is_active = true
		GROUP BY p.id, p.name, p.product_code, p.min_stock_level, p.max_stock_level, p.retail_price
		ORDER BY current_stock DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query).Scan(&summary).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate stock summary"})
		return
	}

	// Calculate totals
	totalValue := float64(0)
	lowStockCount := 0

	for _, item := range summary {
		if val, ok := item["inventory_value"].(float64); ok {
			totalValue += val
		}
		if isLow, ok := item["is_low_stock"].(bool); ok && isLow {
			lowStockCount++
		}
	}

	response := map[string]interface{}{
		"products":         summary,
		"total_products":   len(summary),
		"total_value":      totalValue,
		"low_stock_count":  lowStockCount,
		"low_stock_items":  filterLowStock(summary),
	}

	c.JSON(http.StatusOK, response)
}

// GetExpiryReports retrieves expiry reports for products
func (h *ReportsHandler) GetExpiryReports(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	days := c.Query("days")
	if days == "" {
		days = "30" // Default to 30 days
	}

	daysInt, _ := strconv.Atoi(days)

	var report []map[string]interface{}

	query := `
		SELECT
			p.id,
			p.name as product_name,
			p.product_code,
			p.batch_number,
			p.expiry_date,
			EXTRACT(DAYS FROM (p.expiry_date - CURRENT_DATE)) as days_to_expiry,
			p.quantity as current_quantity,
			p.purchase_price * p.quantity as inventory_value
		FROM products p
		WHERE p.expiry_date IS NOT NULL
		AND p.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '%d days')
		AND p.is_active = true
		ORDER BY p.expiry_date ASC
	`

	if err := h.db.DB.WithContext(ctx).Raw(fmt.Sprintf(query, daysInt)).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate expiry report"})
		return
	}

	response := map[string]interface{}{
		"days_threshold": daysInt,
		"expiring_items": report,
		"total_items":    len(report),
	}

	c.JSON(http.StatusOK, response)
}

// GetStockMovement retrieves stock movement report
func (h *ReportsHandler) GetStockMovement(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	productID := c.Query("product_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	query := `
		SELECT
			il.transaction_type,
			il.quantity,
			il.created_at as movement_date,
			i.invoice_number as reference,
			u.first_name || ' ' || u.last_name as performed_by
		FROM inventory_levels il
		LEFT JOIN invoices i ON il.reference_id = i.id
		LEFT JOIN users u ON il.created_by = u.id
		WHERE il.created_at BETWEEN ? AND ?
		AND il.is_active = true
	`

	params := []interface{}{startDate, endDate}

	if productID != "" {
		query += " AND il.product_id = ?"
		params = append(params, productID)
	}

	query += " ORDER BY il.created_at DESC"

	var movements []map[string]interface{}

	if err := h.db.DB.WithContext(ctx).Raw(query, params...).Scan(&movements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve stock movement"})
		return
	}

	response := map[string]interface{}{
		"start_date":  startDate,
		"end_date":    endDate,
		"movements":   movements,
		"total_movements": len(movements),
	}

	c.JSON(http.StatusOK, response)
}

// GetInventoryValuation retrieves inventory valuation report
func (h *ReportsHandler) GetInventoryValuation(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var valuation []map[string]interface{}

	query := `
		SELECT
			p.category_id,
			c.name as category_name,
			COUNT(p.id) as product_count,
			COALESCE(SUM(p.purchase_price * (
				COALESCE(SUM(CASE WHEN il.transaction_type = 'in' THEN il.quantity ELSE 0 END), 0) -
				COALESCE(SUM(CASE WHEN il.transaction_type = 'out' THEN il.quantity ELSE 0 END), 0)
			)), 0) as total_value
		FROM products p
		JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory_levels il ON p.id = il.product_id AND il.is_active = true
		WHERE p.is_active = true AND c.is_active = true
		GROUP BY p.category_id, c.name
		ORDER BY total_value DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query).Scan(&valuation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate inventory valuation"})
		return
	}

	totalValue := float64(0)
	for _, item := range valuation {
		if val, ok := item["total_value"].(float64); ok {
			totalValue += val
		}
	}

	response := map[string]interface{}{
		"categories":       valuation,
		"total_categories": len(valuation),
		"total_value":      totalValue,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== PURCHASE REPORTS ====================

// GetVendorPerformance retrieves vendor performance report
func (h *ReportsHandler) GetVendorPerformance(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current year
		now := time.Now()
		startDate = fmt.Sprintf("%d-01-01", now.Year())
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			v.id,
			v.name as vendor_name,
			v.phone,
			COUNT(po.id) as po_count,
			COALESCE(SUM(po.total_amount), 0) as total_purchases,
			COUNT(grn.id) as grn_count,
			AVG(EXTRACT(DAYS FROM (grn.receipt_date - po.order_date))) as avg_delivery_days,
			COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_orders
		FROM vendors v
		LEFT JOIN purchase_orders po ON v.id = po.vendor_id AND po.order_date BETWEEN ? AND ?
		LEFT JOIN grn ON po.id = grn.purchase_order_id AND grn.receipt_date BETWEEN ? AND ?
		WHERE v.is_active = true
		GROUP BY v.id, v.name, v.phone
		ORDER BY total_purchases DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate vendor performance report"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"vendors":    report,
		"total_vendors": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// GetProductPurchaseAnalysis retrieves product purchase analysis
func (h *ReportsHandler) GetProductPurchaseAnalysis(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current year
		now := time.Now()
		startDate = fmt.Sprintf("%d-01-01", now.Year())
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			p.id,
			p.name as product_name,
			p.product_code,
			SUM(poi.quantity) as total_quantity,
			COUNT(DISTINCT po.id) as po_count,
			COALESCE(SUM(poi.total_amount), 0) as total_purchases,
			AVG(poi.unit_price) as avg_unit_price,
			MAX(po.order_date) as last_purchase_date
		FROM products p
		JOIN purchase_order_items poi ON p.id = poi.product_id
		JOIN purchase_orders po ON poi.purchase_order_id = po.id
		WHERE po.order_date BETWEEN ? AND ? AND p.is_active = true AND po.is_active = true
		GROUP BY p.id, p.name, p.product_code
		ORDER BY total_purchases DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate product purchase analysis"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"products":   report,
		"total_products": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== FINANCIAL REPORTS ====================

// GetProfitAnalysis retrieves profit analysis report
func (h *ReportsHandler) GetProfitAnalysis(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	// Sales revenue
	salesQuery := `
		SELECT COALESCE(SUM(total_amount), 0) as total_sales
		FROM invoices
		WHERE invoice_date BETWEEN ? AND ? AND is_active = true
	`

	// Cost of goods sold (based on purchase prices)
	cogsQuery := `
		SELECT COALESCE(SUM(ii.quantity * p.purchase_price), 0) as total_cogs
		FROM invoice_items ii
		JOIN products p ON ii.product_id = p.id
		JOIN invoices i ON ii.invoice_id = i.id
		WHERE i.invoice_date BETWEEN ? AND ? AND i.is_active = true
	`

	// Operating expenses
	expensesQuery := `
		SELECT COALESCE(SUM(total_amount), 0) as total_expenses
		FROM expenses
		WHERE expense_date BETWEEN ? AND ? AND is_active = true AND status = 'approved'
	`

	var sales, cogs, expenses float64

	h.db.DB.WithContext(ctx).Raw(salesQuery, startDate, endDate).Scan(&sales)
	h.db.DB.WithContext(ctx).Raw(cogsQuery, startDate, endDate).Scan(&cogs)
	h.db.DB.WithContext(ctx).Raw(expensesQuery, startDate, endDate).Scan(&expenses)

	grossProfit := sales - cogs
	netProfit := grossProfit - expenses

	response := map[string]interface{}{
		"start_date":      startDate,
		"end_date":        endDate,
		"total_sales":     sales,
		"cost_of_goods":   cogs,
		"gross_profit":    grossProfit,
		"operating_expenses": expenses,
		"net_profit":      netProfit,
		"gross_margin":    calculatePercentage(grossProfit, sales),
		"net_margin":      calculatePercentage(netProfit, sales),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== HOMEOPATHY-SPECIFIC REPORTS ====================

// GetDoctorPatientReports retrieves doctor-patient reports
func (h *ReportsHandler) GetDoctorPatientReports(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			d.id,
			d.name as doctor_name,
			d.specialization,
			COUNT(DISTINCT p.id) as patient_count,
			COUNT(a.id) as appointment_count,
			COUNT(pr.id) as prescription_count,
			COALESCE(SUM(pr.total_amount), 0) as total_revenue,
			AVG(EXTRACT(DAYS FROM (a.appointment_date - a.created_at))) as avg_treatment_duration
		FROM doctors d
		LEFT JOIN patients p ON d.id = p.doctor_id
		LEFT JOIN appointments a ON p.id = a.patient_id
		LEFT JOIN prescriptions pr ON p.id = pr.patient_id
		WHERE d.is_active = true
		GROUP BY d.id, d.name, d.specialization
		ORDER BY total_revenue DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate doctor-patient reports"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"doctors":    report,
		"total_doctors": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// GetPrescriptionAnalysis retrieves prescription analysis
func (h *ReportsHandler) GetPrescriptionAnalysis(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			m.id,
			m.name as medicine_name,
			m.potency,
			COUNT(pr.id) as prescription_count,
			SUM(pri.quantity) as total_quantity,
			COALESCE(SUM(pri.total_amount), 0) as total_revenue,
			COUNT(DISTINCT pr.patient_id) as unique_patients
		FROM medicines m
		JOIN prescription_items pri ON m.id = pri.medicine_id
		JOIN prescriptions pr ON pri.prescription_id = pr.id
		WHERE pr.prescription_date BETWEEN ? AND ? AND m.is_active = true
		GROUP BY m.id, m.name, m.potency
		ORDER BY total_revenue DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate prescription analysis"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"medicines":  report,
		"total_medicines": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// GetTreatmentOutcomes retrieves treatment outcomes report
func (h *ReportsHandler) GetTreatmentOutcomes(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var report []map[string]interface{}

	query := `
		SELECT
			tp.treatment_type,
			COUNT(tp.id) as treatment_count,
			AVG(tp.duration_days) as avg_duration,
			SUM(tp.success_rate) as total_success_rate,
			COUNT(CASE WHEN tp.outcome = 'successful' THEN 1 END) as successful_treatments,
			COUNT(CASE WHEN tp.outcome = 'ongoing' THEN 1 END) as ongoing_treatments,
			COUNT(CASE WHEN tp.outcome = 'failed' THEN 1 END) as failed_treatments
		FROM treatment_plans tp
		WHERE tp.start_date BETWEEN ? AND ? AND tp.is_active = true
		GROUP BY tp.treatment_type
		ORDER BY treatment_count DESC
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate treatment outcomes report"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"treatments": report,
		"total_treatments": len(report),
	}

	c.JSON(http.StatusOK, response)
}

// ==================== UTILITY FUNCTIONS ====================

func calculateTotal(data []map[string]interface{}, field string) float64 {
	total := float64(0)
	for _, item := range data {
		if val, ok := item[field].(float64); ok {
			total += val
		}
	}
	return total
}

func calculatePercentage(value, total float64) float64 {
	if total == 0 {
		return 0
	}
	return (value / total) * 100
}

func filterLowStock(data []map[string]interface{}) []map[string]interface{} {
	var result []map[string]interface{}
	for _, item := range data {
		if isLow, ok := item["is_low_stock"].(bool); ok && isLow {
			result = append(result, item)
		}
	}
	return result
}
