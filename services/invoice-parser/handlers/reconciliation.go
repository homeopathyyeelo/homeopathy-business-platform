package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReconciliationHandler struct {
	db *sql.DB
}

func NewReconciliationHandler(db *sql.DB) *ReconciliationHandler {
	return &ReconciliationHandler{db: db}
}

// POST /api/v1/purchases/invoices/:id/lines/:lineId/match
func (h *ReconciliationHandler) MatchLine(c *gin.Context) {
	invoiceID := c.Param("id")
	lineID := c.Param("lineId")
	
	var req struct {
		ProductID  *string `json:"product_id"`
		Action     string  `json:"action"` // match|create|ignore
		BatchNo    *string `json:"batch_no"`
		ExpiryDate *string `json:"expiry_date"`
		NewProduct *struct {
			Name     string  `json:"name"`
			Brand    string  `json:"brand"`
			Potency  string  `json:"potency"`
			Form     string  `json:"form"`
			PackSize string  `json:"pack_size"`
			MRP      float64 `json:"mrp"`
		} `json:"new_product"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	tx, _ := h.db.Begin()
	defer tx.Rollback()
	
	switch req.Action {
	case "match":
		if req.ProductID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "product_id required for match"})
			return
		}
		
		// Update line with matched product
		_, err := tx.Exec(`
			UPDATE parsed_invoice_lines
			SET matched_product_id = $1,
				batch_no = COALESCE($2, batch_no),
				expiry_date = COALESCE($3, expiry_date),
				match_type = 'manual',
				match_confidence = 1.0,
				status = 'matched'
			WHERE id = $4
		`, req.ProductID, req.BatchNo, req.ExpiryDate, lineID)
		
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		// Learn vendor mapping
		var vendorID string
		tx.QueryRow(`
			SELECT vendor_id FROM parsed_invoices WHERE id = $1
		`, invoiceID).Scan(&vendorID)
		
		var description string
		tx.Exec(`
			SELECT description FROM parsed_invoice_lines WHERE id = $1
		`, lineID).Scan(&description)
		
		tx.Exec(`
			INSERT INTO vendor_product_mappings (
				id, vendor_id, vendor_name, product_id, 
				match_confidence, created_at
			) VALUES ($1, $2, $3, $4, 1.0, $5)
			ON CONFLICT (vendor_id, vendor_name) 
			DO UPDATE SET product_id = $4, last_used_at = $5
		`, uuid.New().String(), vendorID, description, req.ProductID, time.Now())
		
	case "create":
		if req.NewProduct == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "new_product required for create"})
			return
		}
		
		// Create new product
		newProductID := uuid.New().String()
		_, err := tx.Exec(`
			INSERT INTO products (
				id, name, brand, potency, form, pack_size, 
				mrp, status, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
		`, newProductID, req.NewProduct.Name, req.NewProduct.Brand,
			req.NewProduct.Potency, req.NewProduct.Form, req.NewProduct.PackSize,
			req.NewProduct.MRP, time.Now())
		
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		// Update line
		tx.Exec(`
			UPDATE parsed_invoice_lines
			SET matched_product_id = $1,
				match_type = 'created',
				match_confidence = 1.0,
				status = 'matched'
			WHERE id = $2
		`, newProductID, lineID)
		
	case "ignore":
		tx.Exec(`
			UPDATE parsed_invoice_lines
			SET status = 'ignored'
			WHERE id = $1
		`, lineID)
	}
	
	tx.Commit()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Line " + req.Action + " successful",
	})
}

// GET /api/v1/products/search
func (h *ReconciliationHandler) SearchProducts(c *gin.Context) {
	query := c.Query("q")
	brand := c.Query("brand")
	potency := c.Query("potency")
	limit := c.DefaultQuery("limit", "20")
	
	sql := `
		SELECT id, name, brand, potency, form, pack_size, mrp,
			   similarity(name, $1) as sim
		FROM products
		WHERE similarity(name, $1) > 0.3
	`
	
	args := []interface{}{query}
	argIdx := 2
	
	if brand != "" {
		sql += " AND brand ILIKE $" + string(rune(argIdx))
		args = append(args, "%"+brand+"%")
		argIdx++
	}
	
	if potency != "" {
		sql += " AND potency ILIKE $" + string(rune(argIdx))
		args = append(args, "%"+potency+"%")
		argIdx++
	}
	
	sql += " ORDER BY sim DESC LIMIT $" + string(rune(argIdx))
	args = append(args, limit)
	
	rows, err := h.db.Query(sql, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	
	products := []gin.H{}
	for rows.Next() {
		var id, name, brand, potency, form, packSize string
		var mrp, sim float64
		
		rows.Scan(&id, &name, &brand, &potency, &form, &packSize, &mrp, &sim)
		products = append(products, gin.H{
			"id":        id,
			"name":      name,
			"brand":     brand,
			"potency":   potency,
			"form":      form,
			"pack_size": packSize,
			"mrp":       mrp,
			"score":     sim,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
	})
}

// GET /api/v1/purchases/reconciliations
func (h *ReconciliationHandler) ListReconciliations(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	
	rows, err := h.db.Query(`
		SELECT pi.id, pi.vendor_id, v.name as vendor_name,
			   pi.invoice_number, pi.created_at,
			   COUNT(pil.id) as total_lines,
			   SUM(CASE WHEN pil.status = 'pending' THEN 1 ELSE 0 END) as pending_lines
		FROM parsed_invoices pi
		LEFT JOIN vendors v ON v.id = pi.vendor_id
		LEFT JOIN parsed_invoice_lines pil ON pil.parsed_invoice_id = pi.id
		WHERE pi.status = $1
		GROUP BY pi.id, pi.vendor_id, v.name, pi.invoice_number, pi.created_at
		HAVING SUM(CASE WHEN pil.status = 'pending' THEN 1 ELSE 0 END) > 0
		ORDER BY pi.created_at DESC
		LIMIT 50
	`, status)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	
	tasks := []gin.H{}
	for rows.Next() {
		var id, vendorID, vendorName, invoiceNum string
		var createdAt time.Time
		var totalLines, pendingLines int
		
		rows.Scan(&id, &vendorID, &vendorName, &invoiceNum, &createdAt, &totalLines, &pendingLines)
		tasks = append(tasks, gin.H{
			"id":            id,
			"vendor_id":     vendorID,
			"vendor_name":   vendorName,
			"invoice_number": invoiceNum,
			"created_at":    createdAt,
			"total_lines":   totalLines,
			"pending_lines": pendingLines,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    tasks,
	})
}
