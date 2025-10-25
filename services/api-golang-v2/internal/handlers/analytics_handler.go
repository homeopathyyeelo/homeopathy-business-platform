package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnalyticsHandler struct {
	db interface{}
}

type SaleRecord struct {
	ID           string    `json:"id"`
	InvoiceNo    string    `json:"invoice_no"`
	Date         time.Time `json:"date"`
	CustomerName string    `json:"customer_name"`
	CustomerID   string    `json:"customer_id"`
	TotalAmount  float64   `json:"total_amount"`
	TaxAmount    float64   `json:"tax_amount"`
	DiscAmount   float64   `json:"discount_amount"`
	NetAmount    float64   `json:"net_amount"`
	Status       string    `json:"status"`
	PaymentMode  string    `json:"payment_mode"`
	ItemsCount   int       `json:"items_count"`
}

type PurchaseRecord struct {
	ID          string    `json:"id"`
	PONumber    string    `json:"po_number"`
	Date        time.Time `json:"date"`
	VendorName  string    `json:"vendor_name"`
	VendorID    string    `json:"vendor_id"`
	TotalAmount float64   `json:"total_amount"`
	TaxAmount   float64   `json:"tax_amount"`
	DiscAmount  float64   `json:"discount_amount"`
	NetAmount   float64   `json:"net_amount"`
	Status      string    `json:"status"`
	ItemsCount  int       `json:"items_count"`
	GRNNumber   string    `json:"grn_number"`
}

type SalesSummary struct {
	TotalSales       float64 `json:"total_sales"`
	TotalTransactions int    `json:"total_transactions"`
	AvgOrderValue    float64 `json:"avg_order_value"`
	TodaySales       float64 `json:"today_sales"`
	WeekSales        float64 `json:"week_sales"`
	MonthSales       float64 `json:"month_sales"`
	CashSales        float64 `json:"cash_sales"`
	CardSales        float64 `json:"card_sales"`
	UPISales         float64 `json:"upi_sales"`
}

type PurchaseSummary struct {
	TotalPurchases    float64 `json:"total_purchases"`
	TotalOrders       int     `json:"total_orders"`
	AvgOrderValue     float64 `json:"avg_order_value"`
	TodayPurchases    float64 `json:"today_purchases"`
	WeekPurchases     float64 `json:"week_purchases"`
	MonthPurchases    float64 `json:"month_purchases"`
	PendingOrders     int     `json:"pending_orders"`
	CompletedOrders   int     `json:"completed_orders"`
}

func NewAnalyticsHandler(db interface{}) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

// GET /api/erp/analytics/sales
func (h *AnalyticsHandler) GetSales(c *gin.Context) {
	_ = c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	_ = c.DefaultQuery("to", time.Now().Format("2006-01-02"))
	_ = c.Query("status")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "50")

	// Mock data
	sales := []SaleRecord{
		{
			ID:           uuid.New().String(),
			InvoiceNo:    "INV-2024-001",
			Date:         time.Now().Add(-24 * time.Hour),
			CustomerName: "Rajesh Medical Store",
			CustomerID:   uuid.New().String(),
			TotalAmount:  8500.00,
			TaxAmount:    1530.00,
			DiscAmount:   425.00,
			NetAmount:    9605.00,
			Status:       "paid",
			PaymentMode:  "UPI",
			ItemsCount:   12,
		},
		{
			ID:           uuid.New().String(),
			InvoiceNo:    "INV-2024-002",
			Date:         time.Now().Add(-48 * time.Hour),
			CustomerName: "City Pharmacy",
			CustomerID:   uuid.New().String(),
			TotalAmount:  15200.00,
			TaxAmount:    2736.00,
			DiscAmount:   760.00,
			NetAmount:    17176.00,
			Status:       "paid",
			PaymentMode:  "Cash",
			ItemsCount:   25,
		},
		{
			ID:           uuid.New().String(),
			InvoiceNo:    "INV-2024-003",
			Date:         time.Now().Add(-72 * time.Hour),
			CustomerName: "Health Plus Clinic",
			CustomerID:   uuid.New().String(),
			TotalAmount:  22400.00,
			TaxAmount:    4032.00,
			DiscAmount:   1120.00,
			NetAmount:    25312.00,
			Status:       "pending",
			PaymentMode:  "Credit",
			ItemsCount:   38,
		},
		{
			ID:           uuid.New().String(),
			InvoiceNo:    "INV-2024-004",
			Date:         time.Now().Add(-96 * time.Hour),
			CustomerName: "Dr. Sharma Homeopathy",
			CustomerID:   uuid.New().String(),
			TotalAmount:  6800.00,
			TaxAmount:    1224.00,
			DiscAmount:   340.00,
			NetAmount:    7684.00,
			Status:       "paid",
			PaymentMode:  "Card",
			ItemsCount:   8,
		},
		{
			ID:           uuid.New().String(),
			InvoiceNo:    "INV-2024-005",
			Date:         time.Now().Add(-120 * time.Hour),
			CustomerName: "Medicare Distributors",
			CustomerID:   uuid.New().String(),
			TotalAmount:  45000.00,
			TaxAmount:    8100.00,
			DiscAmount:   2250.00,
			NetAmount:    50850.00,
			Status:       "paid",
			PaymentMode:  "UPI",
			ItemsCount:   65,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      len(sales),
			"total_pages": 1,
		},
	})
}

// GET /api/erp/analytics/purchases
func (h *AnalyticsHandler) GetPurchases(c *gin.Context) {
	_ = c.DefaultQuery("from", time.Now().AddDate(0, -1, 0).Format("2006-01-02"))
	_ = c.DefaultQuery("to", time.Now().Format("2006-01-02"))
	_ = c.Query("status")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "50")

	// Mock data
	purchases := []PurchaseRecord{
		{
			ID:          uuid.New().String(),
			PONumber:    "PO-2024-001",
			Date:        time.Now().Add(-24 * time.Hour),
			VendorName:  "SBL Pharmaceuticals",
			VendorID:    uuid.New().String(),
			TotalAmount: 28500.00,
			TaxAmount:   5130.00,
			DiscAmount:  1425.00,
			NetAmount:   32205.00,
			Status:      "received",
			ItemsCount:  45,
			GRNNumber:   "GRN-2024-001",
		},
		{
			ID:          uuid.New().String(),
			PONumber:    "PO-2024-002",
			Date:        time.Now().Add(-48 * time.Hour),
			VendorName:  "Dr. Reckeweg & Co",
			VendorID:    uuid.New().String(),
			TotalAmount: 35200.00,
			TaxAmount:   6336.00,
			DiscAmount:  1760.00,
			NetAmount:   39776.00,
			Status:      "received",
			ItemsCount:  52,
			GRNNumber:   "GRN-2024-002",
		},
		{
			ID:          uuid.New().String(),
			PONumber:    "PO-2024-003",
			Date:        time.Now().Add(-72 * time.Hour),
			VendorName:  "Allen Homoeo Lab",
			VendorID:    uuid.New().String(),
			TotalAmount: 18900.00,
			TaxAmount:   3402.00,
			DiscAmount:  945.00,
			NetAmount:   21357.00,
			Status:      "pending",
			ItemsCount:  28,
			GRNNumber:   "",
		},
		{
			ID:          uuid.New().String(),
			PONumber:    "PO-2024-004",
			Date:        time.Now().Add(-96 * time.Hour),
			VendorName:  "Schwabe India",
			VendorID:    uuid.New().String(),
			TotalAmount: 42000.00,
			TaxAmount:   7560.00,
			DiscAmount:  2100.00,
			NetAmount:   47460.00,
			Status:      "received",
			ItemsCount:  68,
			GRNNumber:   "GRN-2024-003",
		},
		{
			ID:          uuid.New().String(),
			PONumber:    "PO-2024-005",
			Date:        time.Now().Add(-120 * time.Hour),
			VendorName:  "Bakson Homeopathy",
			VendorID:    uuid.New().String(),
			TotalAmount: 25600.00,
			TaxAmount:   4608.00,
			DiscAmount:  1280.00,
			NetAmount:   28928.00,
			Status:      "received",
			ItemsCount:  38,
			GRNNumber:   "GRN-2024-004",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    purchases,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      len(purchases),
			"total_pages": 1,
		},
	})
}

// GET /api/erp/analytics/sales-summary
func (h *AnalyticsHandler) GetSalesSummary(c *gin.Context) {
	summary := SalesSummary{
		TotalSales:        524750.50,
		TotalTransactions: 1247,
		AvgOrderValue:     420.75,
		TodaySales:        12450.00,
		WeekSales:         85670.00,
		MonthSales:        245670.00,
		CashSales:         185250.00,
		CardSales:         125800.00,
		UPISales:          213700.50,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

// GET /api/erp/analytics/purchase-summary
func (h *AnalyticsHandler) GetPurchaseSummary(c *gin.Context) {
	summary := PurchaseSummary{
		TotalPurchases:  328920.00,
		TotalOrders:     842,
		AvgOrderValue:   390.62,
		TodayPurchases:  8500.00,
		WeekPurchases:   52340.00,
		MonthPurchases:  185670.00,
		PendingOrders:   23,
		CompletedOrders: 819,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}
