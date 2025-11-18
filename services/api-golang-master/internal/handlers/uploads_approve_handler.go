package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ApproveUploadHandler handles approval of upload sessions (mirrors TS approve route)
type ApproveUploadHandler struct {
	db *gorm.DB
}

func NewApproveUploadHandler(db *gorm.DB) *ApproveUploadHandler {
	return &ApproveUploadHandler{db: db}
}

// ApproveSession handles POST /api/uploads/approve (mirrors TS logic)
func (h *ApproveUploadHandler) ApproveSession(c *gin.Context) {
	// Get auth token (simplified)
	authToken := c.GetHeader("Authorization")
	if authToken == "" {
		cookie, err := c.Cookie("auth-token")
		if err == nil {
			authToken = cookie
		}
	}
	if authToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Decode user ID (simplified)
	userID := "system" // In production, decode JWT properly

	var req struct {
		SessionID string `json:"sessionId" binding:"required"`
		Action    string `json:"action" binding:"required"` // 'approve' or 'reject'
		Reason    string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Action == "reject" {
		// Reject the session
		var session map[string]interface{}
		if err := h.db.Raw(`
			UPDATE upload_sessions
			SET approval_status = 'rejected', status = 'rejected', approved_by = ?, approved_at = NOW(),
				rejection_reason = ?, updated_at = NOW()
			WHERE id = ? AND approval_status = 'pending'
			RETURNING *
		`, userID, req.Reason, req.SessionID).Scan(&session).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Session not found or already processed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Upload rejected successfully",
			"session": session,
		})
		return
	}

	if req.Action == "approve" {
		// Approve and import
		tx := h.db.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Get session
		var session map[string]interface{}
		if err := tx.Raw(`SELECT * FROM upload_sessions WHERE id = ?`, req.SessionID).Scan(&session).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
			return
		}

		// Update session status
		if err := tx.Exec(`
			UPDATE upload_sessions
			SET approval_status = 'approved', status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
			WHERE id = ?
		`, userID, req.SessionID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update session"})
			return
		}

		// Import based on type
		if session["upload_type"] == "purchase" {
			if err := h.importPurchaseData(tx, req.SessionID, userID); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else if session["upload_type"] == "inventory" {
			if err := h.importInventoryData(tx, req.SessionID, userID); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Upload approved and imported successfully",
			"session": session,
		})
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
}

// importPurchaseData mirrors TS importPurchaseData
func (h *ApproveUploadHandler) importPurchaseData(tx *gorm.DB, sessionID, userID string) error {
	// Get purchase upload
	var purchase struct {
		ID            string
		VendorID      *string
		VendorName    string
		VendorGSTIN   *string
		InvoiceNumber string
		InvoiceDate   *string
		Subtotal      float64
		TaxAmount     float64
		TotalAmount   float64
	}
	if err := tx.Raw(`
		SELECT id, vendor_id, vendor_name, vendor_gstin, invoice_number, invoice_date,
		       subtotal, tax_amount, total_amount
		FROM purchase_uploads WHERE session_id = ? LIMIT 1
	`, sessionID).Scan(&purchase).Error; err != nil {
		return err
	}

	// Create vendor if needed
	vendorID := purchase.VendorID
	if vendorID == nil {
		var newVendorID string
		if err := tx.Raw(`
			INSERT INTO vendors (name, company_name, gstin, phone, is_active, created_at, updated_at)
			VALUES (?, ?, ?, ?, true, NOW(), NOW())
			RETURNING id
		`, purchase.VendorName, purchase.VendorName, purchase.VendorGSTIN, nil).Scan(&newVendorID).Error; err != nil {
			return err
		}
		vendorID = &newVendorID
	}

	// Create purchase order
	var purchaseOrderID string
	if err := tx.Raw(`
		INSERT INTO purchase_orders (
			order_number, po_number, invoice_no, vendor_id, order_date,
			subtotal, tax_amount, total_amount, status,
			created_by, approved_by, approved_at, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
		RETURNING id
	`, "PO-"+strconv.FormatInt(int64(uuid.New().ID()), 10), "PO-"+strconv.FormatInt(int64(uuid.New().ID()), 10),
		purchase.InvoiceNumber, *vendorID, purchase.InvoiceDate,
		purchase.Subtotal, purchase.TaxAmount, purchase.TotalAmount, "APPROVED",
		userID, userID).Scan(&purchaseOrderID).Error; err != nil {
		return err
	}

	// Get upload items and process
	var items []struct {
		ID               string
		RowNumber        int
		ProductCode      string
		ProductName      string
		Brand            *string
		Potency          *string
		Size             *string
		Form             *string
		HSNCode          *string
		BatchNumber      *string
		ExpiryDate       *string
		Quantity         float64
		UnitPrice        float64
		MRP              float64
		DiscountPercent  float64
		DiscountAmount   float64
		TaxPercent       float64
		TaxAmount        float64
		TotalAmount      float64
		MatchedProductID *string
		MatchType        string
	}
	if err := tx.Raw(`
		SELECT id, row_number, product_code, product_name, brand, potency, size, form,
		       hsn_code, batch_number, expiry_date, quantity, unit_price, mrp,
		       discount_percent, discount_amount, tax_percent, tax_amount, total_amount,
		       matched_product_id, match_type
		FROM upload_items WHERE session_id = ? ORDER BY row_number
	`, sessionID).Scan(&items).Error; err != nil {
		return err
	}

	for _, item := range items {
		productID := item.MatchedProductID

		// Create product if not matched
		if productID == nil {
			newID, err := h.createProductForImport(tx, item)
			if err != nil {
				return err
			}
			productID = &newID
		}

		// Insert purchase item
		if err := tx.Exec(`
			INSERT INTO purchase_items (
				purchase_order_id, purchase_id, product_id, product_name, product_code,
				batch_number, expiry_date, quantity, unit_price,
				discount_percent, discount_amount, tax_percent, tax_amount, amount
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, purchaseOrderID, purchaseOrderID, *productID, item.ProductName, item.ProductCode,
			item.BatchNumber, item.ExpiryDate, item.Quantity, item.UnitPrice,
			item.DiscountPercent, item.DiscountAmount, item.TaxPercent, item.TaxAmount, item.TotalAmount).Error; err != nil {
			return err
		}

		// Update product stock
		if err := tx.Exec(`
			UPDATE products SET current_stock = current_stock + ?, updated_at = NOW() WHERE id = ?
		`, item.Quantity, *productID).Error; err != nil {
			return err
		}

		// Update inventory batch
		if err := tx.Exec(`
			INSERT INTO inventory_batches (
				product_id, batch_number, expiry_date, quantity, available_quantity,
				unit_cost, selling_price, mrp, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
			ON CONFLICT (product_id, batch_number)
			DO UPDATE SET
				quantity = inventory_batches.quantity + EXCLUDED.quantity,
				available_quantity = inventory_batches.available_quantity + EXCLUDED.quantity,
				updated_at = NOW()
		`, *productID, item.BatchNumber, item.ExpiryDate, item.Quantity, item.Quantity,
			item.UnitPrice, item.MRP, item.MRP).Error; err != nil {
			return err
		}

		// Try core.inventory_batches if exists (non-fatal)
		tx.Exec(`
			INSERT INTO core.inventory_batches (
				shop_id, product_id, batch_no, expiry_date, qty, landed_unit_cost, last_restocked
			) VALUES ((SELECT id FROM core.shops ORDER BY created_at ASC LIMIT 1), ?, ?, ?, ?, ?, NOW())
			ON CONFLICT (shop_id, product_id, batch_no)
			DO UPDATE SET
				qty = core.inventory_batches.qty + EXCLUDED.qty,
				landed_unit_cost = COALESCE(EXCLUDED.landed_unit_cost, core.inventory_batches.landed_unit_cost),
				last_restocked = NOW()
		`, *productID, item.BatchNumber, item.ExpiryDate, item.Quantity, item.UnitPrice)
	}

	// Update purchase upload status
	tx.Exec(`UPDATE purchase_uploads SET status = 'imported', purchase_order_id = ? WHERE session_id = ?`, purchaseOrderID, sessionID)

	// Update upload items status
	tx.Exec(`UPDATE upload_items SET status = 'matched' WHERE session_id = ? AND matched_product_id IS NOT NULL`, sessionID)

	return nil
}

// importInventoryData mirrors TS importInventoryData
func (h *ApproveUploadHandler) importInventoryData(tx *gorm.DB, sessionID, userID string) error {
	var items []struct {
		ID         string
		ProductID  *string
		Quantity   float64
		CostPrice  *float64
		MRP        *float64
		BatchNum   *string
		ExpiryDate *string
		Location   *string
	}
	if err := tx.Raw(`
		SELECT id, product_id, quantity, cost_price, mrp, batch_number, expiry_date, location
		FROM inventory_uploads WHERE session_id = ?
	`, sessionID).Scan(&items).Error; err != nil {
		return err
	}

	for _, item := range items {
		if item.ProductID == nil {
			continue // Skip unmatched
		}

		// Update product stock
		tx.Exec(`UPDATE products SET stock_qty = stock_qty + ?, updated_at = NOW() WHERE id = ?`, item.Quantity, *item.ProductID)

		// Insert/update inventory batch
		cost := item.CostPrice
		if cost == nil {
			cost = &[]float64{0}[0]
		}
		selling := item.MRP
		if selling == nil {
			selling = cost
		}

		tx.Exec(`
			INSERT INTO inventory_batches (
				product_id, batch_number, expiry_date, quantity, available_quantity,
				unit_cost, selling_price, mrp, warehouse_location, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
			ON CONFLICT (product_id, batch_number)
			DO UPDATE SET
				quantity = inventory_batches.quantity + EXCLUDED.quantity,
				available_quantity = inventory_batches.available_quantity + EXCLUDED.quantity,
				unit_cost = EXCLUDED.unit_cost,
				selling_price = EXCLUDED.selling_price,
				mrp = EXCLUDED.mrp,
				updated_at = NOW()
		`, *item.ProductID, item.BatchNum, item.ExpiryDate, item.Quantity, item.Quantity, *cost, *selling, item.MRP, item.Location)

		// Mark inventory upload as imported
		tx.Exec(`UPDATE inventory_uploads SET status = 'imported' WHERE id = ?`, item.ID)
	}

	// Update upload items status
	tx.Exec(`UPDATE upload_items SET status = 'matched' WHERE session_id = ? AND matched_product_id IS NOT NULL`, sessionID)

	return nil
}

// createProductForImport creates a product during approval (mirrors TS logic)
func (h *ApproveUploadHandler) createProductForImport(tx *gorm.DB, item struct {
	ID               string
	RowNumber        int
	ProductCode      string
	ProductName      string
	Brand            *string
	Potency          *string
	Size             *string
	Form             *string
	HSNCode          *string
	BatchNumber      *string
	ExpiryDate       *string
	Quantity         float64
	UnitPrice        float64
	MRP              float64
	DiscountPercent  float64
	DiscountAmount   float64
	TaxPercent       float64
	TaxAmount        float64
	TotalAmount      float64
	MatchedProductID *string
	MatchType        string
}) (string, error) {
	// Determine HSN/GST
	hsnCode := "30049014"
	gstRate := 5.0
	if item.Form != nil {
		form := strings.ToLower(*item.Form)
		name := strings.ToLower(item.ProductName)
		cosmeticKeywords := []string{"shampoo", "soap", "toothpaste", "facewash", "hair oil", "lotion", "cream", "deodorant", "cosmetic", "beauty"}
		for _, kw := range cosmeticKeywords {
			if strings.Contains(name, kw) || strings.Contains(form, kw) {
				hsnCode = "330499"
				gstRate = 18.0
				break
			}
		}
	}

	// Get/create category
	categoryName := "Uncategorized"
	if item.Brand != nil {
		categoryName = *item.Brand
	}
	var categoryID *string
	tx.Raw(`SELECT id FROM categories WHERE name = ? LIMIT 1`, categoryName).Scan(&categoryID)
	if categoryID == nil {
		var newID string
		tx.Raw(`INSERT INTO categories (name, code, description, is_active) VALUES (?, ?, ?, true) RETURNING id`,
			categoryName, strings.ToUpper(strings.ReplaceAll(categoryName, " ", "_")), "Auto-created category").Scan(&newID)
		categoryID = &newID
	}

	// Get/create brand
	var brandID *string
	if item.Brand != nil {
		tx.Raw(`SELECT id FROM brands WHERE name = ? LIMIT 1`, *item.Brand).Scan(&brandID)
		if brandID == nil {
			var newID string
			tx.Raw(`INSERT INTO brands (name, code, description, is_active) VALUES (?, ?, ?, true) RETURNING id`,
				*item.Brand, strings.ToUpper(strings.ReplaceAll(*item.Brand, " ", "_")), "Auto-created brand").Scan(&newID)
			brandID = &newID
		}
	}

	// Get/create HSN
	var hsnID *string
	tx.Raw(`SELECT id FROM hsn_codes WHERE code = ? LIMIT 1`, hsnCode).Scan(&hsnID)
	if hsnID == nil {
		var newID string
		tx.Raw(`INSERT INTO hsn_codes (code, description, gst_rate, is_active) VALUES (?, ?, ?, true) RETURNING id`,
			hsnCode, "Auto-created HSN", gstRate).Scan(&newID)
		hsnID = &newID
	}

	// Generate barcode
	barcode := strings.ToUpper(strings.ReplaceAll(item.ProductCode, " ", ""))
	if barcode == "" {
		barcode = "PROD" + strconv.FormatInt(int64(uuid.New().ID()), 10)
	}

	// Create product
	var productID string
	if err := tx.Raw(`
		INSERT INTO products (
			name, sku, barcode, brand_id, category_id, potency, form,
			hsn_code_id, gst_rate, mrp, pack_size, unit, description,
			current_stock, is_active, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, true, NOW(), NOW())
		RETURNING id
	`, item.ProductName, item.ProductCode, barcode, brandID, categoryID, item.Potency, item.Form,
		hsnID, gstRate, item.MRP, item.Size, "pcs", "Auto-created from purchase upload").Scan(&productID).Error; err != nil {
		return "", err
	}

	return productID, nil
}
