package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yeelo/homeopathy-erp/internal/models"
)

// EnhancedPurchaseHandler handles enhanced purchase operations
type EnhancedPurchaseHandler struct {
	db interface{}
}

// NewEnhancedPurchaseHandler creates a new enhanced purchase handler
func NewEnhancedPurchaseHandler(db interface{}) *EnhancedPurchaseHandler {
	return &EnhancedPurchaseHandler{db: db}
}

// GetEnhancedPurchases returns enhanced purchase orders with filtering
// GET /api/purchases
func (h *EnhancedPurchaseHandler) GetEnhancedPurchases(c *gin.Context) {
	var purchases []models.PurchaseSummaryResponse

	query := h.db.(*gorm.DB).Table("purchase_orders po").
		Select(`
			po.id,
			po.invoice_no,
			po.invoice_date,
			po.total_amount,
			po.status,
			po.created_by,
			po.created_at,
			po.approved_at,
			v.name as supplier_name,
			COUNT(pi.id) as items_count
		`).
		Joins("LEFT JOIN vendors v ON v.id = po.supplier_id").
		Joins("LEFT JOIN purchase_items pi ON pi.purchase_id = po.id").
		Group("po.id, po.invoice_no, po.invoice_date, po.total_amount, po.status, po.created_by, po.created_at, po.approved_at, v.name")

	// Apply filters
	if supplierID := c.Query("supplier_id"); supplierID != "" {
		if sid, err := strconv.ParseUint(supplierID, 10, 32); err == nil {
			query = query.Where("po.supplier_id = ?", sid)
		}
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("po.status = ?", status)
	}

	if invoiceNo := c.Query("invoice_no"); invoiceNo != "" {
		query = query.Where("po.invoice_no ILIKE ?", "%"+invoiceNo+"%")
	}

	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("po.invoice_date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("po.invoice_date <= ?", endDate)
	}

	// Pagination
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	query = query.Order("po.created_at DESC").Limit(limit).Offset(offset)

	if err := query.Find(&purchases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch purchases: " + err.Error(),
		})
		return
	}

	// Get total count
	var total int64
	countQuery := h.db.(*gorm.DB).Table("purchase_orders po")
	if supplierID := c.Query("supplier_id"); supplierID != "" {
		if sid, err := strconv.ParseUint(supplierID, 10, 32); err == nil {
			countQuery = countQuery.Where("supplier_id = ?", sid)
		}
	}
	if status := c.Query("status"); status != "" {
		countQuery = countQuery.Where("status = ?", status)
	}
	countQuery.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    purchases,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetEnhancedPurchase returns detailed purchase order with items
// GET /api/purchases/:id
func (h *EnhancedPurchaseHandler) GetEnhancedPurchase(c *gin.Context) {
	purchaseID := c.Param("id")

	var purchase models.PurchaseSummaryResponse

	err := h.db.(*gorm.DB).Table("purchase_orders po").
		Select(`
			po.id,
			po.invoice_no,
			po.invoice_date,
			po.total_amount,
			po.status,
			po.notes,
			po.created_by,
			po.created_at,
			po.approved_by,
			po.approved_at,
			v.name as supplier_name,
			v.email as supplier_email,
			v.phone as supplier_phone,
			COUNT(pi.id) as items_count
		`).
		Joins("LEFT JOIN vendors v ON v.id = po.supplier_id").
		Joins("LEFT JOIN purchase_items pi ON pi.purchase_id = po.id").
		Where("po.id = ?", purchaseID).
		Group("po.id, po.invoice_no, po.invoice_date, po.total_amount, po.status, po.notes, po.created_by, po.created_at, po.approved_by, po.approved_at, v.name, v.email, v.phone").
		First(&purchase).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Purchase order not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch purchase: " + err.Error(),
		})
		return
	}

	// Get purchase items
	var items []models.PurchaseItemResponse
	if err := h.db.(*gorm.DB).Table("purchase_items pi").
		Select(`
			pi.id,
			p.name as product_name,
			p.sku,
			pi.batch_no,
			pi.qty,
			pi.rate,
			pi.mrp,
			pi.amount,
			pi.mfg_date,
			pi.exp_date,
			pi.discount_percent,
			pi.tax_percent
		`).
		Joins("LEFT JOIN products p ON p.id = pi.product_id").
		Where("pi.purchase_id = ?", purchaseID).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch purchase items: " + err.Error(),
		})
		return
	}

	purchase.Items = items

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    purchase,
	})
}

// CreateEnhancedPurchase creates a new purchase order
// POST /api/purchases
func (h *EnhancedPurchaseHandler) CreateEnhancedPurchase(c *gin.Context) {
	var req models.PurchaseUploadRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Start transaction
	tx := h.db.(*gorm.DB).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Calculate total amount
	var totalAmount float64
	for _, item := range req.Items {
		// Calculate amount per item: qty * rate * (1 - discount/100) * (1 + tax/100)
		amount := item.Qty * item.Rate * (1 - item.DiscountPercent/100) * (1 + item.TaxPercent/100)
		totalAmount += amount
	}

	// Create purchase order
	purchase := models.EnhancedPurchaseOrder{
		SupplierID:  &req.SupplierID,
		InvoiceNo:   req.InvoiceNo,
		InvoiceDate: req.InvoiceDate,
		TotalAmount: totalAmount,
		Status:      "draft",
		Notes:       req.Notes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := tx.Create(&purchase).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create purchase order: " + err.Error(),
		})
		return
	}

	// Create purchase items
	for _, item := range req.Items {
		amount := item.Qty * item.Rate * (1 - item.DiscountPercent/100) * (1 + item.TaxPercent/100)

		purchaseItem := models.EnhancedPurchaseItem{
			PurchaseID:      purchase.ID,
			ProductID:       item.ProductID,
			BatchNo:         item.BatchNo,
			Qty:             item.Qty,
			Rate:            item.Rate,
			MRP:             item.MRP,
			MfgDate:         item.MfgDate,
			ExpDate:         item.ExpDate,
			DiscountPercent: item.DiscountPercent,
			TaxPercent:      item.TaxPercent,
			Amount:          &amount,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		if err := tx.Create(&purchaseItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to create purchase item: " + err.Error(),
			})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to commit transaction: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Purchase order created successfully",
		"data": gin.H{
			"id":          purchase.ID,
			"invoice_no":  purchase.InvoiceNo,
			"total_amount": purchase.TotalAmount,
			"items_count": len(req.Items),
		},
	})
}

// ApproveEnhancedPurchase approves a purchase order and updates inventory
// PUT /api/purchases/:id/approve
func (h *EnhancedPurchaseHandler) ApproveEnhancedPurchase(c *gin.Context) {
	purchaseID := c.Param("id")

	// Get current user ID (from context or token)
	// For now, using a placeholder - should come from auth middleware
	currentUserID := uint(1)

	// Start transaction
	tx := h.db.(*gorm.DB).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get purchase with items
	var purchase models.EnhancedPurchaseOrder
	if err := tx.Preload("Items").First(&purchase, purchaseID).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Purchase order not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch purchase: " + err.Error(),
		})
		return
	}

	// Check if already approved
	if purchase.Status == "approved" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Purchase order already approved",
		})
		return
	}

	// Update purchase status
	now := time.Now()
	purchase.Status = "approved"
	purchase.ApprovedBy = &currentUserID
	purchase.ApprovedAt = &now
	purchase.UpdatedAt = now

	if err := tx.Save(&purchase).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to approve purchase: " + err.Error(),
		})
		return
	}

	// Process each item: update inventory and create transactions
	for _, item := range purchase.Items {
		// Check if batch already exists
		var existingStock models.EnhancedInventoryStock
		err := tx.Where("product_id = ? AND batch_no = ? AND (warehouse_id IS NULL OR warehouse_id = 1)",
			item.ProductID, item.BatchNo).First(&existingStock).Error

		var newQtyIn, newBalance float64

		if err == nil {
			// Batch exists, add to existing
			newQtyIn = existingStock.QtyIn + item.Qty
			newBalance = existingStock.Balance + item.Qty
		} else {
			// New batch
			newQtyIn = item.Qty
			newBalance = item.Qty
		}

		// Update or create inventory stock
		stockData := models.EnhancedInventoryStock{
			ProductID:    item.ProductID,
			BatchNo:      item.BatchNo,
			WarehouseID:  nil, // Default warehouse
			QtyIn:        newQtyIn,
			Balance:      newBalance,
			PurchaseRate: &item.Rate,
			MRP:          &item.MRP,
			MfgDate:      item.MfgDate,
			ExpDate:      item.ExpDate,
			LastTxnType:  &[]string{"IN"}[0],
			LastTxnDate:  &now,
			Status:       "active",
			UpdatedAt:    now,
		}

		if err == nil {
			// Update existing
			if err := tx.Model(&existingStock).Updates(stockData).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   "Failed to update inventory stock: " + err.Error(),
				})
				return
			}
		} else {
			// Create new
			stockData.CreatedAt = now
			if err := tx.Create(&stockData).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error":   "Failed to create inventory stock: " + err.Error(),
				})
				return
			}
		}

		// Create transaction record
		balanceBefore := existingStock.Balance
		purchaseIDStr := strconv.FormatUint(uint64(purchase.ID), 10)
		txnData := models.EnhancedStockTransaction{
			ProductID:     item.ProductID,
			BatchNo:       &item.BatchNo,
			WarehouseID:   nil,
			Type:          "IN",
			Qty:           item.Qty,
			BalanceBefore: &balanceBefore,
			BalanceAfter:  &newBalance,
			Source:        "purchase",
			RefID:         &purchaseIDStr,
			RefType:       &[]string{"purchase_order"}[0],
			Reason:        &[]string{fmt.Sprintf("Purchase: %s", purchase.InvoiceNo)}[0],
			CreatedBy:     &currentUserID,
			CreatedAt:     now,
		}

		if err := tx.Create(&txnData).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to create transaction: " + err.Error(),
			})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to commit transaction: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Purchase order approved and inventory updated successfully",
		"data": gin.H{
			"purchase_id": purchase.ID,
			"invoice_no":  purchase.InvoiceNo,
			"items_count": len(purchase.Items),
			"total_amount": purchase.TotalAmount,
		},
	})
}

// RejectEnhancedPurchase rejects a purchase order
// PUT /api/purchases/:id/reject
func (h *EnhancedPurchaseHandler) RejectEnhancedPurchase(c *gin.Context) {
	purchaseID := c.Param("id")
	reason := c.Query("reason")

	// Get current user ID (placeholder)
	currentUserID := uint(1)

	// Update purchase status
	now := time.Now()
	result := h.db.(*gorm.DB).Model(&models.EnhancedPurchaseOrder{}).
		Where("id = ? AND status != 'approved'", purchaseID).
		Updates(gin.H{
			"status":      "rejected",
			"approved_by": currentUserID,
			"approved_at": now,
			"notes":       reason,
			"updated_at":  now,
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to reject purchase: " + result.Error.Error(),
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Purchase order not found or already approved",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Purchase order rejected successfully",
	})
}

// GetPendingPurchases returns purchases pending approval
// GET /api/purchases/pending
func (h *EnhancedPurchaseHandler) GetPendingPurchases(c *gin.Context) {
	// Check if table exists first
	var tableExists bool
	err := h.db.(*gorm.DB).Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders')").Scan(&tableExists).Error
	
	if err != nil || !tableExists {
		// Return empty array if table doesn't exist
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    []interface{}{},
			"total":   0,
			"message": "Purchase orders table not yet created",
		})
		return
	}

	// Use a simpler query to avoid column mismatch errors
	var purchases []map[string]interface{}
	query := h.db.(*gorm.DB).Table("purchase_orders").
		Where("status IN (?, ?)", "DRAFT", "PENDING").
		Order("created_at DESC")

	if err := query.Find(&purchases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch pending purchases: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    purchases,
		"total":   len(purchases),
	})
}

// GetPurchaseItems returns items for a specific purchase
// GET /api/purchases/:id/items
func (h *EnhancedPurchaseHandler) GetPurchaseItems(c *gin.Context) {
	purchaseID := c.Param("id")

	var items []models.PurchaseItemResponse

	query := h.db.(*gorm.DB).Table("purchase_items pi").
		Select(`
			pi.id,
			p.name as product_name,
			p.sku,
			p.category,
			p.brand,
			pi.batch_no,
			pi.qty,
			pi.rate,
			pi.mrp,
			pi.amount,
			pi.mfg_date,
			pi.exp_date,
			pi.discount_percent,
			pi.tax_percent
		`).
		Joins("LEFT JOIN products p ON p.id = pi.product_id").
		Where("pi.purchase_id = ?", purchaseID).
		Order("pi.id")

	if err := query.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch purchase items: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
		"total":   len(items),
	})
}

// UpdatePurchaseItem updates a purchase item
// PUT /api/purchases/:id/items/:itemId
func (h *EnhancedPurchaseHandler) UpdatePurchaseItem(c *gin.Context) {
	purchaseID := c.Param("id")
	itemID := c.Param("itemId")

	var req models.PurchaseItemRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Convert purchaseID to uint
	purchaseIDUint, err := strconv.ParseUint(purchaseID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid purchase ID",
		})
		return
	}

	// Calculate amount
	amount := req.Qty * req.Rate * (1 - req.DiscountPercent/100) * (1 + req.TaxPercent/100)

	// Update purchase item
	result := h.db.(*gorm.DB).Model(&models.EnhancedPurchaseItem{}).
		Where("id = ? AND purchase_id = ?", itemID, purchaseIDUint).
		Updates(gin.H{
			"product_id":        req.ProductID,
			"batch_no":         req.BatchNo,
			"qty":              req.Qty,
			"rate":             req.Rate,
			"mrp":              req.MRP,
			"mfg_date":         req.MfgDate,
			"exp_date":         req.ExpDate,
			"discount_percent": req.DiscountPercent,
			"tax_percent":      req.TaxPercent,
			"amount":           amount,
			"updated_at":       time.Now(),
		})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update purchase item: " + result.Error.Error(),
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Purchase item not found",
		})
		return
	}

	// Recalculate purchase total
	h.recalculatePurchaseTotal(uint(purchaseIDUint))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Purchase item updated successfully",
	})
}

// DeletePurchaseItem deletes a purchase item
// DELETE /api/purchases/:id/items/:itemId
func (h *EnhancedPurchaseHandler) DeletePurchaseItem(c *gin.Context) {
	purchaseID := c.Param("id")
	itemID := c.Param("itemId")

	// Convert purchaseID to uint
	purchaseIDUint, err := strconv.ParseUint(purchaseID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid purchase ID",
		})
		return
	}

	// Check if purchase is still editable
	var purchase models.EnhancedPurchaseOrder
	if err := h.db.(*gorm.DB).First(&purchase, purchaseIDUint).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Purchase order not found",
		})
		return
	}

	if purchase.Status == "approved" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Cannot delete items from approved purchase order",
		})
		return
	}

	// Delete purchase item
	result := h.db.(*gorm.DB).Delete(&models.EnhancedPurchaseItem{}, itemID)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete purchase item: " + result.Error.Error(),
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Purchase item not found",
		})
		return
	}

	// Recalculate purchase total
	h.recalculatePurchaseTotal(uint(purchaseIDUint))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Purchase item deleted successfully",
	})
}

// AddPurchaseItem adds a new item to a purchase order
// POST /api/purchases/:id/items
func (h *EnhancedPurchaseHandler) AddPurchaseItem(c *gin.Context) {
	purchaseID := c.Param("id")

	var req models.PurchaseItemRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Convert purchaseID to uint
	purchaseIDUint, err := strconv.ParseUint(purchaseID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid purchase ID",
		})
		return
	}

	// Check if purchase is still editable
	var purchase models.EnhancedPurchaseOrder
	if err := h.db.(*gorm.DB).First(&purchase, purchaseIDUint).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Purchase order not found",
		})
		return
	}

	if purchase.Status == "approved" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Cannot add items to approved purchase order",
		})
		return
	}

	// Calculate amount
	amount := req.Qty * req.Rate * (1 - req.DiscountPercent/100) * (1 + req.TaxPercent/100)

	// Create purchase item
	purchaseItem := models.EnhancedPurchaseItem{
		PurchaseID:      uint(purchaseIDUint),
		ProductID:       req.ProductID,
		BatchNo:         req.BatchNo,
		Qty:             req.Qty,
		Rate:            req.Rate,
		MRP:             req.MRP,
		MfgDate:         req.MfgDate,
		ExpDate:         req.ExpDate,
		DiscountPercent: req.DiscountPercent,
		TaxPercent:      req.TaxPercent,
		Amount:          &amount,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := h.db.(*gorm.DB).Create(&purchaseItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create purchase item: " + err.Error(),
		})
		return
	}

	// Recalculate purchase total
	h.recalculatePurchaseTotal(uint(purchaseIDUint))

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Purchase item added successfully",
		"data": gin.H{
			"id": purchaseItem.ID,
			"amount": amount,
		},
	})
}

// Helper function to recalculate purchase total
func (h *EnhancedPurchaseHandler) recalculatePurchaseTotal(purchaseID uint) error {
	var total float64

	err := h.db.(*gorm.DB).Table("purchase_items").
		Select("COALESCE(SUM(amount), 0) as total").
		Where("purchase_id = ?", purchaseID).
		Scan(&total).Error

	if err != nil {
		return err
	}

	return h.db.(*gorm.DB).Model(&models.EnhancedPurchaseOrder{}).
		Where("id = ?", purchaseID).
		Updates(gin.H{
			"total_amount": total,
			"updated_at":   time.Now(),
		}).Error
}
