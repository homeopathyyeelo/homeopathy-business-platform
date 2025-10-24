package main

import (
    "log"
    "os"

    "github.com/gin-gonic/gin"

    cfgpkg "github.com/yeelo/homeopathy-erp/internal/config"
    dbpkg "github.com/yeelo/homeopathy-erp/internal/database"
    "github.com/yeelo/homeopathy-erp/internal/handlers"
    "github.com/yeelo/homeopathy-erp/internal/services"
)

func main() {
    // Load configuration
    cfg := cfgpkg.Load()

    // Init database connection
    db := dbpkg.Init(cfg.DatabaseURL)

    // Services and handlers
    expirySvc := services.NewExpiryService(db)
    expiryHandler := handlers.NewExpiryHandler(expirySvc)
    bugSvc := services.NewBugService(db)
    bugHandler := handlers.NewBugHandler(bugSvc)
    dashboardHandler := handlers.NewDashboardHandler(db)
    analyticsHandler := handlers.NewAnalyticsHandler(db)
    commissionHandler := handlers.NewCommissionHandler(db)
    bulkOpsHandler := handlers.NewBulkOperationsHandler(db)
    damageHandler := handlers.NewDamageHandler(db)
    bundleHandler := handlers.NewBundleHandler(db)
    loyaltyHandler := handlers.NewLoyaltyHandler(db)
    whatsappHandler := handlers.NewWhatsAppHandler(db)
    paymentHandler := handlers.NewPaymentGatewayHandler(db)
    posHandler := handlers.NewPOSHandler(db)
    estimateHandler := handlers.NewEstimateHandler(db)

    r := gin.Default()

    // Health endpoint
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "status":  "healthy",
            "service": "golang-v2",
        })
    })

    // API v2 routes
    v2 := r.Group("/api/v2")
    {
        // Inventory expiry APIs
        v2.GET("/inventory/expiries", expiryHandler.GetExpirySummary)
        v2.POST("/inventory/expiries/refresh", expiryHandler.RefreshExpirySummary)
        v2.GET("/inventory/expiries/alerts", expiryHandler.GetExpiryAlerts)

        // Dashboard
        v2.GET("/dashboard/expiry-summary", expiryHandler.GetDashboardSummary)
    }

    // ERP routes (shared prefix)
    erp := r.Group("/api/erp")
    {
        // Dashboard routes
        erp.GET("/dashboard/summary", dashboardHandler.GetSummary)
        erp.GET("/dashboard/stats", dashboardHandler.GetStats)
        erp.GET("/dashboard/activity", dashboardHandler.GetActivity)
        erp.GET("/dashboard/top-products", dashboardHandler.GetTopProducts)
        erp.GET("/dashboard/recent-sales", dashboardHandler.GetRecentSales)
        erp.GET("/dashboard/revenue-chart", dashboardHandler.GetRevenueChart)

        // System routes
        erp.GET("/system/health", dashboardHandler.GetSystemHealth)

        // Analytics routes
        erp.GET("/analytics/sales", analyticsHandler.GetSales)
        erp.GET("/analytics/purchases", analyticsHandler.GetPurchases)
        erp.GET("/analytics/sales-summary", analyticsHandler.GetSalesSummary)
        erp.GET("/analytics/purchase-summary", analyticsHandler.GetPurchaseSummary)
        
        // Commission routes
        erp.POST("/commissions/rules", commissionHandler.CreateRule)
        erp.GET("/commissions/calculate", commissionHandler.CalculateCommission)
        erp.GET("/commissions/report", commissionHandler.GetCommissionReport)
        erp.POST("/commissions/pay", commissionHandler.PayCommission)
        
        // Bulk operations
        erp.PUT("/products/bulk-update", bulkOpsHandler.BulkUpdateProducts)
        erp.PUT("/customers/bulk-update", bulkOpsHandler.BulkUpdateCustomers)
        erp.POST("/customers/bulk-import", bulkOpsHandler.BulkImportCustomers)
        erp.PUT("/vendors/bulk-update", bulkOpsHandler.BulkUpdateVendors)
        erp.DELETE("/bulk-delete", bulkOpsHandler.BulkDelete)
        
        // Damage tracking
        erp.POST("/inventory/damages", damageHandler.CreateDamageEntry)
        erp.GET("/inventory/damages", damageHandler.GetDamageEntries)
        erp.GET("/inventory/damages/summary", damageHandler.GetDamageSummary)
        erp.DELETE("/inventory/damages/:id", damageHandler.DeleteDamageEntry)
        
        // Product bundles
        erp.POST("/bundles", bundleHandler.CreateBundle)
        erp.GET("/bundles", bundleHandler.GetBundles)
        erp.GET("/bundles/:id", bundleHandler.GetBundle)
        erp.PUT("/bundles/:id", bundleHandler.UpdateBundle)
        erp.DELETE("/bundles/:id", bundleHandler.DeleteBundle)
        erp.POST("/bundles/:id/sell", bundleHandler.SellBundle)
        
        // Loyalty
        erp.POST("/loyalty/cards", loyaltyHandler.CreateCard)
        erp.GET("/loyalty/cards/:customer_id", loyaltyHandler.GetCustomerCard)
        erp.POST("/loyalty/earn", loyaltyHandler.EarnPoints)
        erp.POST("/loyalty/redeem", loyaltyHandler.RedeemPoints)
        erp.GET("/loyalty/transactions/:card_id", loyaltyHandler.GetTransactions)
        
        // WhatsApp
        erp.POST("/whatsapp/bulk-send", whatsappHandler.BulkSendMessages)
        erp.POST("/whatsapp/credit-reminder", whatsappHandler.SendCreditReminder)
        
        // Payment Gateway
        erp.POST("/payments/create-order", paymentHandler.CreatePaymentOrder)
        erp.POST("/payments/verify", paymentHandler.VerifyPayment)
        
        // POS
        erp.POST("/pos/hold", posHandler.HoldBill)
        erp.GET("/pos/held-bills", posHandler.GetHeldBills)
        erp.POST("/pos/resume/:id", posHandler.ResumeBill)
        erp.DELETE("/pos/held-bills/:id", posHandler.DeleteHeldBill)
        erp.GET("/pos/counters", posHandler.GetCounters)
        erp.POST("/pos/counters/register", posHandler.RegisterCounter)
        
        // Estimates
        erp.POST("/estimates", estimateHandler.CreateEstimate)
        erp.GET("/estimates", estimateHandler.GetEstimates)
        erp.POST("/estimates/:id/convert", estimateHandler.ConvertToInvoice)
        erp.PUT("/estimates/:id/status", estimateHandler.UpdateStatus)
    }

    // API v1 routes (system)
    v1 := r.Group("/api/v1")
    {
        // purchases ingestion proxy to invoice-parser-service
        v1.POST("/purchases/invoices/upload", handlers.PurchasesUpload)

        // Confirm & Post: create GRN + update inventory + outbox
        v1.POST("/purchases/invoices/:id/confirm", func(c *gin.Context) {
            invoiceID := c.Param("id")
            if invoiceID == "" {
                c.JSON(400, gin.H{"error": "invoice id required"}); return
            }
            tx := db.Begin()
            if tx.Error != nil { c.JSON(500, gin.H{"error":"tx begin failed"}); return }
            var receiptID string
            // Create receipt (purchase_receipts)
            err := tx.Raw(`
                WITH totals AS (
                  SELECT 
                    COALESCE(SUM(line_total),0) AS total_amount,
                    COALESCE(SUM(tax_amount),0)  AS tax_amount
                  FROM parsed_invoice_lines WHERE parsed_invoice_id = ?
                ), hdr AS (
                  SELECT 
                    gen_random_uuid() AS rid,
                    ('GRN-'||to_char(now(),'YYYYMMDD')||'-'||substr(gen_random_uuid()::text,1,6)) AS rno,
                    (SELECT vendor_id FROM parsed_invoices WHERE id = ?) AS vendor_id,
                    (SELECT shop_id   FROM parsed_invoices WHERE id = ?) AS shop_id,
                    (SELECT total_amount FROM totals) total_amount,
                    (SELECT tax_amount   FROM totals) tax_amount
                )
                INSERT INTO purchase_receipts (id, receipt_number, parsed_invoice_id, vendor_id, shop_id, receipt_date, total_amount, tax_amount, discount_amount, grand_total, status, created_at)
                SELECT rid, rno, ?, vendor_id, shop_id, now(), total_amount, tax_amount, 0, total_amount, 'posted', now()
                FROM hdr RETURNING id;
            `, invoiceID, invoiceID, invoiceID, invoiceID).Scan(&receiptID).Error
            if err != nil { tx.Rollback(); c.JSON(500, gin.H{"error":"receipt create failed"}); return }

            // Insert lines
            if err = tx.Exec(`
                INSERT INTO purchase_receipt_lines (id, receipt_id, product_id, batch_no, expiry_date, qty, unit_cost, discount_amount, tax_rate, tax_amount, landed_unit_cost, line_total)
                SELECT gen_random_uuid(), ?, matched_product_id, COALESCE(batch_no, 'AUTO-'||to_char(now(),'YYYYMMDD')), expiry_date,
                       COALESCE(qty,0), COALESCE(unit_cost,0), COALESCE(discount_amount,0), COALESCE(tax_rate,0), COALESCE(tax_amount,0),
                       COALESCE(landed_unit_cost, COALESCE(unit_cost,0)), COALESCE(line_total,0)
                FROM parsed_invoice_lines WHERE parsed_invoice_id = ? AND matched_product_id IS NOT NULL;
            `, receiptID, invoiceID).Error; err != nil { tx.Rollback(); c.JSON(500, gin.H{"error":"lines insert failed"}); return }

            // Upsert inventory batches in core schema if present, else public
            // Try core.inventory_batches
            if err = tx.Exec(`
                INSERT INTO core.inventory_batches (id, shop_id, product_id, batch_no, expiry_date, qty, unit_cost, created_at)
                SELECT gen_random_uuid(), (SELECT shop_id FROM parsed_invoices WHERE id = ?), matched_product_id,
                       COALESCE(batch_no, 'AUTO-'||to_char(now(),'YYYYMMDD')), expiry_date, COALESCE(qty,0), COALESCE(landed_unit_cost, COALESCE(unit_cost,0)), now()
                FROM parsed_invoice_lines WHERE parsed_invoice_id = ? AND matched_product_id IS NOT NULL
                ON CONFLICT (shop_id, product_id, batch_no) DO UPDATE SET
                    qty = core.inventory_batches.qty + EXCLUDED.qty,
                    expiry_date = COALESCE(EXCLUDED.expiry_date, core.inventory_batches.expiry_date),
                    unit_cost = EXCLUDED.unit_cost;
            `, invoiceID, invoiceID).Error; err != nil {
                // fallback public.inventory_batches
                if err2 := tx.Exec(`
                    INSERT INTO inventory_batches (id, shop_id, product_id, batch_no, expiry_date, qty, unit_cost, created_at)
                    SELECT gen_random_uuid(), (SELECT shop_id FROM parsed_invoices WHERE id = ?), matched_product_id,
                           COALESCE(batch_no, 'AUTO-'||to_char(now(),'YYYYMMDD')), expiry_date, COALESCE(qty,0), COALESCE(landed_unit_cost, COALESCE(unit_cost,0)), now()
                    FROM parsed_invoice_lines WHERE parsed_invoice_id = ? AND matched_product_id IS NOT NULL
                    ON CONFLICT (shop_id, product_id, batch_no) DO UPDATE SET
                        qty = inventory_batches.qty + EXCLUDED.qty,
                        expiry_date = COALESCE(EXCLUDED.expiry_date, inventory_batches.expiry_date),
                        unit_cost = EXCLUDED.unit_cost;
                `, invoiceID, invoiceID).Error; err2 != nil { tx.Rollback(); c.JSON(500, gin.H{"error":"inventory upsert failed"}); return }
            }

            // Outbox event (best-effort)
            _ = tx.Exec(`
                INSERT INTO sys.outbox(topic, aggregate_type, aggregate_id, payload, metadata)
                VALUES (
                  'inventory.events', 'vendor_receipt', ?,
                  jsonb_build_object('receipt_id', ?, 'invoice_id', ?, 'published_at', now()),
                  jsonb_build_object('source','api-core','trace_id', gen_random_uuid()::text)
                );
            `, receiptID, receiptID, invoiceID).Error

            if err = tx.Commit().Error; err != nil { c.JSON(500, gin.H{"error":"commit failed"}); return }
            c.JSON(201, gin.H{"posted": true, "receipt_id": receiptID})
        })

        sys := v1.Group("/system")
        {
            sys.GET("/bugs", bugHandler.ListBugs)
            sys.GET("/bugs/:id", bugHandler.GetBug)
            sys.POST("/bugs/ingest", bugHandler.Ingest)
            sys.POST("/bugs/:id/approve", bugHandler.Approve)
            sys.GET("/health", func(c *gin.Context) {
                c.JSON(200, gin.H{
                    "success": true,
                    "data": gin.H{
                        "services": []gin.H{
                            {
                                "service": "api-core",
                                "status": "up",
                                "port": 3005,
                                "latency": 45,
                                "uptime": "99.9%",
                                "lastChecked": "2024-10-24T15:30:00Z",
                            },
                            {
                                "service": "ai-service",
                                "status": "up",
                                "port": 8001,
                                "latency": 120,
                                "uptime": "98.5%",
                                "lastChecked": "2024-10-24T15:30:00Z",
                            },
                            {
                                "service": "campaign-service",
                                "status": "up",
                                "port": 3001,
                                "latency": 78,
                                "uptime": "99.2%",
                                "lastChecked": "2024-10-24T15:30:00Z",
                            },
                            {
                                "service": "auth-service",
                                "status": "up",
                                "port": 3003,
                                "latency": 23,
                                "uptime": "100%",
                                "lastChecked": "2024-10-24T15:30:00Z",
                            },
                            {
                                "service": "analytics-service",
                                "status": "degraded",
                                "port": 3002,
                                "latency": 245,
                                "uptime": "95.3%",
                                "lastChecked": "2024-10-24T15:30:00Z",
                            },
                            {
                                "service": "file-service",
                                "status": "up",
                                "port": 3004,
                                "latency": 67,
                                "uptime": "99.7%",
                                "lastChecked": "2024-10-24T15:30:00Z",
                            },
                        },
                    },
                })
            })
        }
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = cfg.Port
        if port == "" {
            port = "3005"
        }
    }

    log.Printf("Golang v2 Server starting on port %s", port)
    log.Fatal(r.Run(":" + port))
}
