package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SalesHandler struct {
	db interface{}
}

func NewSalesHandler(db interface{}) *SalesHandler {
	return &SalesHandler{db: db}
}

// GET /api/erp/sales/orders - List sales orders
func (h *SalesHandler) GetOrders(c *gin.Context) {
	orders := []gin.H{
		{
			"id":           uuid.New().String(),
			"orderNo":      "SO-2024-001",
			"date":         time.Now().Add(-24 * time.Hour).Format("2006-01-02"),
			"customerName": "Rajesh Medical Store",
			"customerType": "B2B",
			"totalAmount":  8500.00,
			"status":       "pending",
			"itemsCount":   12,
		},
		{
			"id":           uuid.New().String(),
			"orderNo":      "SO-2024-002",
			"date":         time.Now().Add(-48 * time.Hour).Format("2006-01-02"),
			"customerName": "City Pharmacy",
			"customerType": "B2B",
			"totalAmount":  15200.00,
			"status":       "completed",
			"itemsCount":   25,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
	})
}

// GET /api/sales/b2b - B2B sales data
func (h *SalesHandler) GetB2BSales(c *gin.Context) {
	sales := []gin.H{
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "B2B-2024-001",
			"date":         time.Now().Add(-24 * time.Hour).Format("2006-01-02"),
			"customerName": "Wholesale Distributor A",
			"totalAmount":  45000.00,
			"status":       "paid",
			"itemsCount":   65,
		},
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "B2B-2024-002",
			"date":         time.Now().Add(-48 * time.Hour).Format("2006-01-02"),
			"customerName": "Wholesale Distributor B",
			"totalAmount":  32000.00,
			"status":       "pending",
			"itemsCount":   42,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/sales/invoices - List invoices
func (h *SalesHandler) GetInvoices(c *gin.Context) {
	invoices := []gin.H{
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "INV-2024-001",
			"date":         time.Now().Format("2006-01-02"),
			"customerName": "Walk-in Customer",
			"totalAmount":  2500.00,
			"status":       "paid",
			"paymentMode":  "Cash",
		},
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "INV-2024-002",
			"date":         time.Now().Format("2006-01-02"),
			"customerName": "Dr. Sharma Clinic",
			"totalAmount":  6800.00,
			"status":       "paid",
			"paymentMode":  "UPI",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    invoices,
	})
}

// POST /api/erp/sales/pos/create - Create POS sale
func (h *SalesHandler) CreatePOSSale(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invoice := gin.H{
		"id":        uuid.New().String(),
		"invoiceNo": "POS-" + time.Now().Format("20060102") + "-" + uuid.New().String()[:6],
		"date":      time.Now().Format("2006-01-02T15:04:05Z"),
		"items":     req["items"],
		"total":     req["total"],
		"status":    "completed",
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    invoice,
		"message": "Sale created successfully",
	})
}

// GET /api/erp/sales/returns - List returns
func (h *SalesHandler) GetReturns(c *gin.Context) {
	returns := []gin.H{
		{
			"id":              uuid.New().String(),
			"returnNo":        "RET-2024-001",
			"date":            time.Now().Add(-24 * time.Hour).Format("2006-01-02"),
			"originalInvoice": "INV-2024-045",
			"customerName":    "City Pharmacy",
			"amount":          1500.00,
			"status":          "completed",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    returns,
	})
}

// GET /api/erp/sales/receipts - List receipts
func (h *SalesHandler) GetReceipts(c *gin.Context) {
	receipts := []gin.H{
		{
			"id":           uuid.New().String(),
			"receiptNo":    "RCP-2024-001",
			"date":         time.Now().Format("2006-01-02"),
			"customerName": "Rajesh Medical Store",
			"amount":       5000.00,
			"paymentMode":  "Bank Transfer",
			"status":       "cleared",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    receipts,
	})
}

// GET /api/erp/sales/b2c - B2C retail sales
func (h *SalesHandler) GetB2CSales(c *gin.Context) {
	sales := []gin.H{
		{
			"id":          uuid.New().String(),
			"invoiceNo":   "B2C-2024-001",
			"date":        time.Now().Format("2006-01-02"),
			"customer":    "Walk-in",
			"totalAmount": 1200.00,
			"status":      "paid",
			"itemsCount":  5,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/sales/d2d - Doctor to Doctor sales
func (h *SalesHandler) GetD2DSales(c *gin.Context) {
	sales := []gin.H{
		{
			"id":           uuid.New().String(),
			"invoiceNo":    "D2D-2024-001",
			"date":         time.Now().Format("2006-01-02"),
			"doctorName":   "Dr. Kumar Homeopathy",
			"totalAmount":  12000.00,
			"status":       "pending",
			"itemsCount":   25,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    sales,
	})
}

// GET /api/erp/sales/credit - Credit sales management
func (h *SalesHandler) GetCreditSales(c *gin.Context) {
	creditSales := []gin.H{
		{
			"id":            uuid.New().String(),
			"customerName":  "City Pharmacy",
			"totalCredit":   45000.00,
			"paid":          20000.00,
			"balance":       25000.00,
			"dueDate":       time.Now().Add(15 * 24 * time.Hour).Format("2006-01-02"),
			"status":        "overdue",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    creditSales,
	})
}

// GET /api/erp/sales/hold-bills - Held bills in POS
func (h *SalesHandler) GetHoldBills(c *gin.Context) {
	holdBills := []gin.H{
		{
			"id":          uuid.New().String(),
			"tempId":      "HOLD-001",
			"counter":     "Counter 1",
			"operator":    "Rajesh Kumar",
			"items":       []gin.H{{"name": "Arnica 30C", "qty": 2, "price": 70.0}},
			"subtotal":    140.00,
			"heldAt":      time.Now().Add(-30 * time.Minute).Format("2006-01-02T15:04:05Z"),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    holdBills,
	})
}
