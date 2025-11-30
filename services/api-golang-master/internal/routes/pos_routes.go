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
		pos.POST("/hold-bill", posHandler.HoldBill)
		pos.GET("/held-bills", posHandler.GetHeldBills)
		pos.POST("/resume-bill/:id", posHandler.ResumeBill)
		pos.DELETE("/held-bill/:id", posHandler.DeleteHeldBill)

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
}
