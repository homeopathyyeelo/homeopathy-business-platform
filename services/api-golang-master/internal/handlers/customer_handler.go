package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CustomerHandler struct {
	DB *gorm.DB
}

func NewCustomerHandler(db *gorm.DB) *CustomerHandler {
	return &CustomerHandler{DB: db}
}

// GetCustomers - GET /api/v1/customers
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	customerType := c.Query("type")
	search := c.Query("search")

	var customers []map[string]interface{}
	query := h.DB.Table("customers").Where("deleted_at IS NULL")

	if customerType != "" && customerType != "ALL" {
		query = query.Where("customer_type = ?", customerType)
	}

	if search != "" {
		query = query.Where("name ILIKE ? OR phone LIKE ? OR email ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	summary := gin.H{
		"total":             len(customers),
		"retail":            0,
		"wholesale":         0,
		"doctor":            0,
		"totalOutstanding":  0.0,
	}

	for _, cust := range customers {
		if custType, ok := cust["customer_type"].(string); ok {
			switch custType {
			case "RETAIL":
				summary["retail"] = summary["retail"].(int) + 1
			case "WHOLESALE":
				summary["wholesale"] = summary["wholesale"].(int) + 1
			case "DOCTOR":
				summary["doctor"] = summary["doctor"].(int) + 1
			}
		}
		if outstanding, ok := cust["outstanding_amount"].(float64); ok {
			summary["totalOutstanding"] = summary["totalOutstanding"].(float64) + outstanding
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    customers,
		"summary": summary,
	})
}

// GetCustomer - GET /api/v1/customers/:id
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	id := c.Param("id")

	var customer map[string]interface{}
	if err := h.DB.Table("customers").Where("id = ? AND deleted_at IS NULL", id).First(&customer).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": customer})
}

// CreateCustomer - POST /api/v1/customers
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	payload["created_at"] = time.Now()
	payload["updated_at"] = time.Now()

	if err := h.DB.Table("customers").Create(&payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    payload,
		"message": "Customer created successfully",
	})
}

// UpdateCustomer - PUT /api/v1/customers/:id
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	payload["updated_at"] = time.Now()

	if err := h.DB.Table("customers").Where("id = ?", id).Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Customer updated successfully"})
}

// GetLoyaltyPoints - GET /api/v1/customers/loyalty
func (h *CustomerHandler) GetLoyaltyPoints(c *gin.Context) {
	var rows []map[string]interface{}
	query := `
		SELECT c.id as customer_id, c.name, c.loyalty_points as points, 
		       c.updated_at as last_earned_at
		FROM customers c
		WHERE c.deleted_at IS NULL AND c.loyalty_points > 0
		ORDER BY c.loyalty_points DESC
		LIMIT 100
	`

	if err := h.DB.Raw(query).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	totalPoints := 0
	for _, r := range rows {
		if pts, ok := r["points"].(int); ok {
			totalPoints += pts
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"summary": gin.H{
			"totalCustomers": len(rows),
			"totalPoints":    totalPoints,
		},
	})
}

// GetOutstanding - GET /api/v1/customers/outstanding
func (h *CustomerHandler) GetOutstanding(c *gin.Context) {
	var rows []map[string]interface{}
	query := `
		SELECT c.id as customer_id, c.name, c.outstanding_amount as outstanding,
		       c.updated_at as last_invoice
		FROM customers c
		WHERE c.deleted_at IS NULL AND c.outstanding_amount > 0
		ORDER BY c.outstanding_amount DESC
	`

	if err := h.DB.Raw(query).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	totalOutstanding := 0.0
	for _, r := range rows {
		if amt, ok := r["outstanding"].(float64); ok {
			totalOutstanding += amt
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"summary": gin.H{
			"totalCustomers":   len(rows),
			"totalOutstanding": totalOutstanding,
		},
	})
}

// GetCreditLimit - GET /api/v1/customers/credit-limit
func (h *CustomerHandler) GetCreditLimit(c *gin.Context) {
	var rows []map[string]interface{}
	query := `
		SELECT c.id as customer_id, c.name, c.credit_limit,
		       c.outstanding_amount as used,
		       (c.credit_limit - c.outstanding_amount) as available
		FROM customers c
		WHERE c.deleted_at IS NULL AND c.credit_limit > 0
		ORDER BY c.credit_limit DESC
	`

	if err := h.DB.Raw(query).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	totalLimit := 0.0
	totalUsed := 0.0
	for _, r := range rows {
		if limit, ok := r["credit_limit"].(float64); ok {
			totalLimit += limit
		}
		if used, ok := r["used"].(float64); ok {
			totalUsed += used
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"summary": gin.H{
			"customersWithCredit": len(rows),
			"totalCreditLimit":    totalLimit,
			"totalUsed":           totalUsed,
			"totalAvailable":      totalLimit - totalUsed,
		},
	})
}

// GetFeedback - GET /api/v1/customers/feedback
func (h *CustomerHandler) GetFeedback(c *gin.Context) {
	var rows []map[string]interface{}
	// Assuming feedback table exists or we return placeholder
	query := `
		SELECT f.id, c.id as customer_id, c.name, f.rating, f.comment, f.created_at as date
		FROM customer_feedback f
		JOIN customers c ON c.id = f.customer_id
		WHERE c.deleted_at IS NULL
		ORDER BY f.created_at DESC
		LIMIT 100
	`

	if err := h.DB.Raw(query).Scan(&rows).Error; err != nil {
		// Table may not exist, return empty
		rows = []map[string]interface{}{}
	}

	avgRating := 0.0
	if len(rows) > 0 {
		sum := 0.0
		for _, r := range rows {
			if rating, ok := r["rating"].(float64); ok {
				sum += rating
			}
		}
		avgRating = sum / float64(len(rows))
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"summary": gin.H{
			"total":     len(rows),
			"avgRating": avgRating,
		},
	})
}

// GetCommunication - GET /api/v1/customers/communication
func (h *CustomerHandler) GetCommunication(c *gin.Context) {
	var rows []map[string]interface{}
	// Placeholder - assuming communication_log table
	query := `
		SELECT cl.id, c.id as customer_id, cl.channel, cl.subject, cl.created_at as date, cl.status
		FROM communication_log cl
		JOIN customers c ON c.id = cl.customer_id
		WHERE c.deleted_at IS NULL
		ORDER BY cl.created_at DESC
		LIMIT 100
	`

	if err := h.DB.Raw(query).Scan(&rows).Error; err != nil {
		rows = []map[string]interface{}{}
	}

	sent := 0
	for _, r := range rows {
		if status, ok := r["status"].(string); ok && status == "SENT" {
			sent++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"summary": gin.H{
			"total": len(rows),
			"sent":  sent,
		},
	})
}

// GetAppointments - GET /api/v1/customers/appointments
func (h *CustomerHandler) GetAppointments(c *gin.Context) {
	var rows []map[string]interface{}
	// Placeholder - assuming appointments table
	query := `
		SELECT a.id, c.id as customer_id, c.name, a.appointment_date as date, 
		       a.appointment_time as time, a.purpose, a.status
		FROM appointments a
		JOIN customers c ON c.id = a.customer_id
		WHERE c.deleted_at IS NULL
		ORDER BY a.appointment_date DESC, a.appointment_time DESC
		LIMIT 100
	`

	if err := h.DB.Raw(query).Scan(&rows).Error; err != nil {
		rows = []map[string]interface{}{}
	}

	scheduled := 0
	for _, r := range rows {
		if status, ok := r["status"].(string); ok && status == "SCHEDULED" {
			scheduled++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    rows,
		"summary": gin.H{
			"total":     len(rows),
			"scheduled": scheduled,
		},
	})
}
