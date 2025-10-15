package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
	"github.com/yeelo/homeopathy-erp/internal/middleware"
)

// AuthRoutes sets up authentication routes
func AuthRoutes(r *gin.RouterGroup) {
	auth := handlers.NewAuthHandler()

	// Basic auth
	r.POST("/register", auth.Register)
	r.POST("/login", auth.Login)
	r.POST("/refresh", auth.RefreshToken)
	r.GET("/me", auth.Me)
	r.POST("/logout", auth.Logout)

	// Password management
	r.POST("/forgot-password", auth.ForgotPassword)
	r.POST("/reset-password", auth.ResetPassword)
	r.GET("/verify-email", auth.VerifyEmail)

	// Social login
	r.POST("/social-login", auth.SocialLogin)

	// 2FA
	r.POST("/enable-2fa", auth.Enable2FA)
	r.POST("/disable-2fa", auth.Disable2FA)

	// User management (admin only)
	admin := r.Group("/admin")
	admin.Use(middleware.RequireRole("admin"))
	{
		r.GET("/users", auth.ListUsers)
		r.GET("/users/:id", auth.GetUser)
		r.POST("/users", auth.CreateUser)
		r.PUT("/users/:id", auth.UpdateUser)
		r.DELETE("/users/:id", auth.DeleteUser)
		r.POST("/users/:id/activate", auth.ActivateUser)
		r.POST("/users/:id/deactivate", auth.DeactivateUser)
	}
}

// UserRoutes sets up user management routes
func UserRoutes(r *gin.RouterGroup) {
	user := handlers.NewUserHandler()

	r.GET("", user.ListUsers)
	r.GET("/:id", user.GetUser)
	r.POST("", user.CreateUser)
	r.PUT("/:id", user.UpdateUser)
	r.DELETE("/:id", user.DeleteUser)
	r.POST("/:id/activate", user.ActivateUser)
	r.POST("/:id/deactivate", user.DeactivateUser)
}

// EmailRoutes sets up email system routes
func EmailRoutes(r *gin.RouterGroup) {
	email := handlers.NewEmailHandler()

	r.POST("/send", email.SendEmail)
	r.GET("/templates", email.ListTemplates)
	r.POST("/templates", email.CreateTemplate)
	r.PUT("/templates/:id", email.UpdateTemplate)
	r.DELETE("/templates/:id", email.DeleteTemplate)
}

// CMSRoutes sets up CMS routes
func CMSRoutes(r *gin.RouterGroup) {
	cms := handlers.NewCMSHandler()

	r.GET("/pages", cms.ListPages)
	r.GET("/pages/:slug", cms.GetPage)
	r.POST("/pages", cms.CreatePage)
	r.PUT("/pages/:id", cms.UpdatePage)
	r.DELETE("/pages/:id", cms.DeletePage)
}

// ERPRoutes sets up all ERP module routes
func ERPRoutes(r *gin.RouterGroup) {
	// Dashboard
	r.GET("/dashboard", handlers.DashboardHandler)

	// Products
	product := handlers.NewProductHandler()
	r.GET("/products", product.ListProducts)
	r.GET("/products/:id", product.GetProduct)
	r.POST("/products", product.CreateProduct)
	r.PUT("/products/:id", product.UpdateProduct)
	r.DELETE("/products/:id", product.DeleteProduct)
	r.GET("/products/:id/stock", product.GetProductStock)
	r.POST("/products/:id/stock", product.UpdateProductStock)
	r.GET("/products/low-stock", product.GetLowStockProducts)
	r.GET("/products/expiring", product.GetExpiringProducts)

	// Sales
	sales := handlers.NewSalesHandler()
	r.GET("/sales", sales.ListSales)
	r.GET("/sales/:id", sales.GetSalesOrder)
	r.POST("/sales", sales.CreateSalesOrder)
	r.PUT("/sales/:id/status", sales.UpdateSalesOrderStatus)
	r.DELETE("/sales/:id", sales.CancelSalesOrder)
	r.GET("/sales/reports", sales.GetSalesReport)
	r.GET("/customers/:customer_id/sales", sales.GetCustomerSalesHistory)

	// Purchases
	purchase := handlers.NewPurchaseHandler()
	r.GET("/purchases", purchase.ListPurchaseOrders)
	r.GET("/purchases/:id", purchase.GetPurchaseOrder)
	r.POST("/purchases", purchase.CreatePurchaseOrder)
	r.PUT("/purchases/:id/status", purchase.UpdatePurchaseOrderStatus)
	r.POST("/purchases/:id/receive", purchase.ReceivePurchaseOrder)

	// Inventory
	inventory := handlers.NewInventoryHandler()
	r.GET("/inventory", inventory.GetInventory)
	r.GET("/inventory/history", inventory.GetInventoryHistory)
	r.POST("/inventory/adjust", inventory.AdjustStock)
	r.POST("/inventory/transfer", inventory.TransferStock)
	r.GET("/inventory/alerts", inventory.GetStockAlerts)
	r.GET("/inventory/valuation", inventory.GetInventoryValuation)

	// Customers
	customer := handlers.NewCustomerHandler()
	r.GET("/customers", customer.ListCustomers)
	r.GET("/customers/:id", customer.GetCustomer)
	r.POST("/customers", customer.CreateCustomer)
	r.PUT("/customers/:id", customer.UpdateCustomer)
	r.DELETE("/customers/:id", customer.DeleteCustomer)

	// Vendors
	vendor := handlers.NewVendorHandler()
	r.GET("/vendors", vendor.ListVendors)
	r.POST("/vendors", vendor.CreateVendor)

	// HR (Employees)
	hr := handlers.NewHRHandler()
	r.GET("/employees", hr.ListEmployees)
	r.POST("/employees", hr.CreateEmployee)

	// Finance
	finance := handlers.NewFinanceHandler()
	r.GET("/finance/ledger/:ledger_id/balance", finance.GetLedgerBalance)
	r.POST("/finance/expenses", finance.CreateExpense)

	// Reports
	reports := handlers.NewReportsHandler()
	r.GET("/reports/sales", reports.GetSalesReport)
	r.GET("/reports/inventory", reports.GetInventoryReport)
	r.GET("/reports/financial", reports.GetFinancialReport)

	// Add more ERP modules here...
}
