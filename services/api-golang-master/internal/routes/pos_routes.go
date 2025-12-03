package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
	"gorm.io/gorm"
)

// RegisterPOSRoutes registers all POS-related routes
func RegisterPOSRoutes(router *gin.RouterGroup, db *gorm.DB) {
	posHandler := handlers.NewPOSEnhancedHandler(db)
	gstHandler := handlers.NewGSTReportsHandler(db)
	eInvoiceHandler := handlers.NewEInvoiceHandler(db)

	// ============================================================================
	// POS PRODUCT SEARCH & INVENTORY
	// ============================================================================
	pos := router.Group("/pos")
	{
		// Product search with batch information (FEFO)
		pos.GET("/search-products", posHandler.SearchProducts)
		pos.GET("/product/:id/batches", posHandler.GetProductBatches)

		// ============================================================================
		// INVOICE MANAGEMENT
		// ============================================================================
		// Create new invoice with GST calculation
		pos.POST("/create-invoice", posHandler.CreateInvoice)

		// Get invoices
		pos.GET("/invoices", posHandler.GetInvoices)
		pos.GET("/invoice/:id", posHandler.GetInvoice)

		// ============================================================================
		// HELD BILLS (PARK & RESUME)
		// ============================================================================
		// NOTE: Hold bill routes moved to main.go (using new HoldBillHandler)
		// Old routes commented out to prevent duplicate registration
		// pos.POST("/hold-bill", posHandler.HoldBill)
		// pos.GET("/held-bills", posHandler.GetHeldBills)
		// pos.POST("/resume-bill/:id", posHandler.ResumeBill)
		// pos.DELETE("/held-bill/:id", posHandler.DeleteHeldBill)

		// ============================================================================
		// SALES RETURNS & REFUNDS
		// ============================================================================
		pos.POST("/create-return", posHandler.CreateReturn)
		pos.GET("/returns", posHandler.GetReturns)

		// ============================================================================
		// DASHBOARD STATS
		// ============================================================================
		pos.GET("/dashboard-stats", gstHandler.GetDashboardStats)

		// ============================================================================
		// DOCTOR COMMISSIONS
		// ============================================================================
		pos.GET("/doctor-commissions", gstHandler.GetDoctorCommissions)
		pos.POST("/doctor-commissions/:id/mark-paid", gstHandler.MarkCommissionPaid)
	}

	// ============================================================================
	// GST COMPLIANCE & REPORTING
	// ============================================================================
	gst := router.Group("/gst")
	{
		// GST Summary
		gst.GET("/summary", gstHandler.GetGSTSummary)

		// GSTR-1 (Sales)
		gst.GET("/gstr1", gstHandler.GetGSTR1Report)

		// GSTR-3B (Summary)
		gst.GET("/gstr3b", gstHandler.GetGSTR3BReport)

		// ITC Ledger
		gst.GET("/itc-ledger", gstHandler.GetITCLedger)
		gst.POST("/itc-ledger", gstHandler.AddITCEntry)

		// HSN-wise reports
		gst.GET("/hsn-wise-sales", gstHandler.GetHSNWiseSales)

		// Registers
		gst.GET("/sales-register", gstHandler.GetSalesRegister)
		gst.GET("/purchase-register", gstHandler.GetPurchaseRegister)

		// Export
		gst.GET("/export", gstHandler.ExportGSTData)
	}

	// ============================================================================
	// E-INVOICE & E-WAY BILL
	// ============================================================================
	einv := router.Group("/einvoice")
	{
		// E-Invoice
		einv.POST("/generate", eInvoiceHandler.GenerateEInvoice)
		einv.GET("/:invoiceId", eInvoiceHandler.GetEInvoiceDetails)
		einv.POST("/cancel", eInvoiceHandler.CancelEInvoice)
	}

	eway := router.Group("/ewaybill")
	{
		// E-Way Bill
		eway.POST("/generate", eInvoiceHandler.GenerateEWayBill)
		eway.POST("/extend", eInvoiceHandler.ExtendEWayBill)
		eway.POST("/cancel", eInvoiceHandler.CancelEWayBill)
	}

	// ============================================================================
	// ORDERS MANAGEMENT & PAYMENT TRACKING
	// ============================================================================
	ordersHandler := handlers.NewOrdersHandler(db)
	orders := router.Group("/orders")
	{
		// List orders with filters
		orders.GET("", ordersHandler.GetOrders)

		// Order details
		orders.GET("/:id", ordersHandler.GetOrderDetails)

		// Payment tracking
		orders.GET("/:id/payments", ordersHandler.GetOrderPayments)
		orders.POST("/:id/payments", ordersHandler.RecordPayment)

		// Thermal printing (3x5 inch for TSE_TE244)
		orders.POST("/:id/print", ordersHandler.PrintOrderThermal)
	}

	// ============================================================================
	// INVOICE THERMAL PRINTING
	// ============================================================================
	invoices := router.Group("/invoices")
	{
		// Print invoice to thermal printer
		invoices.POST("/:invoiceNo/print", ordersHandler.PrintInvoiceThermal)

		// Download invoice A4 PDF
		invoices.GET("/:invoiceNo/download", ordersHandler.DownloadInvoicePDF)
	}

	// ============================================================================
	// BARCODE LABEL PRINTING
	// ============================================================================
	barcodeHandler := handlers.NewBarcodeLabelHandler(db)
	products := router.Group("/products")
	{
		// Get all products with barcodes
		products.GET("/barcode", barcodeHandler.GenerateAllBarcodeLabels)

		// Generate barcode image for single product
		products.GET("/:id/barcode-image", barcodeHandler.GenerateBarcodeImage)

		// Generate barcode by barcode string (direct download)
		products.GET("/barcode/generate", barcodeHandler.GenerateBarcodeByString)

		// Print multiple barcode labels (bulk)
		products.POST("/barcode/print", barcodeHandler.PrintBarcodeLabels)
	}
}
