package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EmployeeHandler struct {
	db *gorm.DB
}

func NewEmployeeHandler(db *gorm.DB) *EmployeeHandler {
	return &EmployeeHandler{db: db}
}

// GET /api/hr/employees
func (h *EmployeeHandler) GetEmployees(c *gin.Context) {
	var employees []map[string]interface{}
	
	// Check if users table exists (employees are stored in users table)
	var tableExists bool
	err := h.db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')").Scan(&tableExists).Error
	
	if err != nil || !tableExists {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    []interface{}{},
			"message": "Users table not yet created",
		})
		return
	}

	if err := h.db.Table("users").
		Where("deleted_at IS NULL").
		Order("created_at DESC").
		Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch employees: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    employees,
	})
}

// GET /api/hr/employees/:id
func (h *EmployeeHandler) GetEmployee(c *gin.Context) {
	id := c.Param("id")
	
	var employee map[string]interface{}
	if err := h.db.Table("users").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&employee).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Employee not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch employee: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    employee,
	})
}

// POST /api/hr/employees
func (h *EmployeeHandler) CreateEmployee(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body: " + err.Error(),
		})
		return
	}

	// Set default values
	payload["id"] = uuid.New().String()
	payload["created_at"] = time.Now()
	payload["updated_at"] = time.Now()
	
	if payload["is_active"] == nil {
		payload["is_active"] = true
	}

	if err := h.db.Table("users").Create(&payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create employee: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Employee created successfully",
		"data":    payload,
	})
}

// PUT /api/hr/employees/:id
func (h *EmployeeHandler) UpdateEmployee(c *gin.Context) {
	id := c.Param("id")
	
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request body: " + err.Error(),
		})
		return
	}

	payload["updated_at"] = time.Now()

	if err := h.db.Table("users").
		Where("id = ?", id).
		Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update employee: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee updated successfully",
	})
}

// DELETE /api/hr/employees/:id
func (h *EmployeeHandler) DeleteEmployee(c *gin.Context) {
	id := c.Param("id")

	// Soft delete
	if err := h.db.Table("users").
		Where("id = ?", id).
		Update("deleted_at", time.Now()).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete employee: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee deleted successfully",
	})
}
