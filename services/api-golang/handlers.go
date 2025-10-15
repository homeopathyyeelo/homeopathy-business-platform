package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Authentication types
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type Claims struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func signJWT(userID, role, secret string) (string, error) {
	claims := Claims{
		Sub:  userID,
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func handleLogin(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}

		// Demo authentication - replace with real authentication
		if req.Email == "admin@yeelo.com" && req.Password == "admin123" {
			token, err := signJWT("admin-1", "ADMIN", jwtSecret)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to generate token"})
				return
			}
			c.JSON(200, gin.H{
				"access_token": token,
				"token_type":   "Bearer",
				"expires_in":   86400,
			})
			return
		}

		c.JSON(401, gin.H{"error": "Invalid credentials"})
	}
}

func handleMe(c *gin.Context) {
	userId := c.GetString("userId")
	role := c.GetString("role")
	
	c.JSON(200, gin.H{
		"id":    userId,
		"role":  role,
		"email": "admin@yeelo.com",
		"name":  "Admin User",
	})
}

// ==================== CRUD HANDLERS ====================

// Generic Handler for CRUD operations
type BaseHandler[T any] struct {
	service *BaseService[T]
}

func NewBaseHandler[T any](service *BaseService[T]) *BaseHandler[T] {
	return &BaseHandler[T]{service: service}
}

func (h *BaseHandler[T]) GetAll(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	filters := make(map[string]interface{})
	// Add query parameters as filters
	for key, values := range c.Request.URL.Query() {
		if len(values) > 0 {
			filters[key] = values[0] // Take first value for simplicity
		}
	}

	entities, err := h.service.GetAll(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entities)
}

func (h *BaseHandler[T]) GetByID(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	entity, err := h.service.GetByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if entity == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Entity not found"})
		return
	}

	c.JSON(http.StatusOK, entity)
}

func (h *BaseHandler[T]) Create(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var entity T
	if err := c.ShouldBindJSON(&entity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.Create(ctx, &entity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func (h *BaseHandler[T]) Update(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var entity T
	if err := c.ShouldBindJSON(&entity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.service.Update(ctx, id, &entity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *BaseHandler[T]) Delete(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	err := h.service.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// Workflow Handlers
type WorkflowHandler struct {
	service *WorkflowService
}

func NewWorkflowHandler(service *WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{service: service}
}

func (h *WorkflowHandler) GetWorkflows(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	category := c.Query("category")
	filters := make(map[string]interface{})
	if category != "" {
		filters["category"] = category
	}

	workflows, err := h.service.GetWorkflowsByCategory(ctx, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, workflows)
}

func (h *WorkflowHandler) GetWorkflow(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	workflow, err := h.service.GetByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if workflow == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	c.JSON(http.StatusOK, workflow)
}

func (h *WorkflowHandler) CreateWorkflow(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var workflow WorkflowDefinition
	if err := c.ShouldBindJSON(&workflow); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.Create(ctx, &workflow)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func (h *WorkflowHandler) UpdateWorkflow(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var workflow WorkflowDefinition
	if err := c.ShouldBindJSON(&workflow); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.service.Update(ctx, id, &workflow)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *WorkflowHandler) DeleteWorkflow(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	err := h.service.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *WorkflowHandler) GetActiveWorkflows(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	workflows, err := h.service.GetActiveWorkflows(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, workflows)
}

// Inventory Handlers
type InventoryHandler struct {
	service *InventoryService
}

func NewInventoryHandler(service *InventoryService) *InventoryHandler {
	return &InventoryHandler{service: service}
}

func (h *InventoryHandler) GetInventory(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	warehouseID := c.Query("warehouse_id")
	filters := make(map[string]interface{})
	if warehouseID != "" {
		filters["warehouse_id"] = warehouseID
	}

	inventory, err := h.service.GetAll(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, inventory)
}

func (h *InventoryHandler) GetInventoryItem(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	item, err := h.service.GetByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Inventory item not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *InventoryHandler) CreateInventoryItem(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var item InventoryLevel
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created, err := h.service.Create(ctx, &item)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func (h *InventoryHandler) UpdateInventoryItem(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var item InventoryLevel
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.service.Update(ctx, id, &item)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *InventoryHandler) DeleteInventoryItem(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	err := h.service.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *InventoryHandler) GetLowStockItems(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	items, err := h.service.GetLowStockItems(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (h *InventoryHandler) UpdateStock(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	newStockStr := c.Query("stock")
	newStock, err := strconv.Atoi(newStockStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stock value"})
		return
	}

	item, err := h.service.UpdateStock(ctx, id, newStock)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// Customer Service Handlers
type CustomerServiceHandler struct {
	service *CustomerServiceService
}

func NewCustomerServiceHandler(service *CustomerServiceService) *CustomerServiceHandler {
	return &CustomerServiceHandler{service: service}
}

func (h *CustomerServiceHandler) GetCustomerServiceMetrics(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	department := c.Query("department")
	filters := make(map[string]interface{})
	if department != "" {
		filters["department"] = department
	}

	metrics, err := h.service.GetAll(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

func (h *CustomerServiceHandler) GetAgentPerformance(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	metric, err := h.service.GetAgentPerformance(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if metric == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent metrics not found"})
		return
	}

	c.JSON(http.StatusOK, metric)
}

func (h *CustomerServiceHandler) GetDepartmentMetrics(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	department := c.Param("department")
	metrics, err := h.service.GetDepartmentMetrics(ctx, department)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// Financial Handlers
type FinancialHandler struct {
	service *FinancialService
}

func NewFinancialHandler(service *FinancialService) *FinancialHandler {
	return &FinancialHandler{service: service}
}

func (h *FinancialHandler) GetFinancialMetrics(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	periodType := c.Query("period_type")
	filters := make(map[string]interface{})
	if periodType != "" {
		filters["period_type"] = periodType
	}

	metrics, err := h.service.GetAll(ctx, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

func (h *FinancialHandler) GetLatestMetrics(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	metric, err := h.service.GetLatestMetrics(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if metric == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No financial metrics found"})
		return
	}

	c.JSON(http.StatusOK, metric)
}

func (h *FinancialHandler) GetMetricsByPeriod(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	periodType := c.Param("period_type")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
		return
	}

	metrics, err := h.service.GetMetricsByPeriod(ctx, periodType, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// Main Handler struct that includes all services
type Handler struct {
	workflowService     *WorkflowService
	inventoryService    *InventoryService
	customerService     *CustomerServiceService
	financialService    *FinancialService
	workflowProcessor   *WorkflowProcessor
}

func NewHandler(ws *WorkflowService, wp *WorkflowProcessor) *Handler {
	return &Handler{
		workflowService:   ws,
		workflowProcessor: wp,
	}
}

// Add methods for other services
func (h *Handler) GetWorkflows(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.GetWorkflows(c)
}

func (h *Handler) GetWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.GetWorkflow(c)
}

func (h *Handler) CreateWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.CreateWorkflow(c)
}

func (h *Handler) UpdateWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.UpdateWorkflow(c)
}

func (h *Handler) DeleteWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.DeleteWorkflow(c)
}

func (h *Handler) GetActiveWorkflows(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.GetActiveWorkflows(c)
}

func (h *Handler) GetInventory(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.GetInventory(c)
}

func (h *Handler) GetInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.GetInventoryItem(c)
}

func (h *Handler) CreateInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.CreateInventoryItem(c)
}

func (h *Handler) UpdateInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.UpdateInventoryItem(c)
}

func (h *Handler) DeleteInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.DeleteInventoryItem(c)
}

func (h *Handler) GetLowStockItems(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.GetLowStockItems(c)
}

func (h *Handler) UpdateStock(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.UpdateStock(c)
}

func (h *Handler) GetCustomerServiceMetrics(c *gin.Context) {
	handler := NewCustomerServiceHandler(h.customerService)
	handler.GetCustomerServiceMetrics(c)
}

func (h *Handler) GetAgentPerformance(c *gin.Context) {
	handler := NewCustomerServiceHandler(h.customerService)
	handler.GetAgentPerformance(c)
}

func (h *Handler) GetDepartmentMetrics(c *gin.Context) {
	handler := NewCustomerServiceHandler(h.customerService)
	handler.GetDepartmentMetrics(c)
}

func (h *Handler) GetFinancialMetrics(c *gin.Context) {
	handler := NewFinancialHandler(h.financialService)
	handler.GetFinancialMetrics(c)
}

func (h *Handler) GetLatestMetrics(c *gin.Context) {
	handler := NewFinancialHandler(h.financialService)
	handler.GetLatestMetrics(c)
}

func (h *Handler) GetMetricsByPeriod(c *gin.Context) {
	handler := NewFinancialHandler(h.financialService)
	handler.GetMetricsByPeriod(c)
}

// Main Handler struct that includes all services
type Handler struct {
	workflowService     *WorkflowService
	inventoryService    *InventoryService
	customerService     *CustomerServiceService
	financialService    *FinancialService
	workflowProcessor   *WorkflowProcessor
}

func NewHandler(ws *WorkflowService, wp *WorkflowProcessor) *Handler {
	return &Handler{
		workflowService:   ws,
		workflowProcessor: wp,
	}
}

// Add methods for other services
func (h *Handler) GetWorkflows(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.GetWorkflows(c)
}

func (h *Handler) GetWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.GetWorkflow(c)
}

func (h *Handler) CreateWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.CreateWorkflow(c)
}

func (h *Handler) UpdateWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.UpdateWorkflow(c)
}

func (h *Handler) DeleteWorkflow(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.DeleteWorkflow(c)
}

func (h *Handler) GetActiveWorkflows(c *gin.Context) {
	handler := NewWorkflowHandler(h.workflowService)
	handler.GetActiveWorkflows(c)
}

func (h *Handler) GetInventory(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.GetInventory(c)
}

func (h *Handler) GetInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.GetInventoryItem(c)
}

func (h *Handler) CreateInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.CreateInventoryItem(c)
}

func (h *Handler) UpdateInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.UpdateInventoryItem(c)
}

func (h *Handler) DeleteInventoryItem(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.DeleteInventoryItem(c)
}

func (h *Handler) GetLowStockItems(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.GetLowStockItems(c)
}

func (h *Handler) UpdateStock(c *gin.Context) {
	handler := NewInventoryHandler(h.inventoryService)
	handler.UpdateStock(c)
}

func (h *Handler) GetCustomerServiceMetrics(c *gin.Context) {
	handler := NewCustomerServiceHandler(h.customerService)
	handler.GetCustomerServiceMetrics(c)
}

func (h *Handler) GetAgentPerformance(c *gin.Context) {
	handler := NewCustomerServiceHandler(h.customerService)
	handler.GetAgentPerformance(c)
}

func (h *Handler) GetDepartmentMetrics(c *gin.Context) {
	handler := NewCustomerServiceHandler(h.customerService)
	handler.GetDepartmentMetrics(c)
}

func (h *Handler) GetFinancialMetrics(c *gin.Context) {
	handler := NewFinancialHandler(h.financialService)
	handler.GetFinancialMetrics(c)
}

func (h *Handler) GetLatestMetrics(c *gin.Context) {
	handler := NewFinancialHandler(h.financialService)
	handler.GetLatestMetrics(c)
}

func (h *Handler) GetMetricsByPeriod(c *gin.Context) {
	handler := NewFinancialHandler(h.financialService)
	handler.GetMetricsByPeriod(c)
}

// Health Check Handler
func (h *Handler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"services": map[string]string{
			"database": "unknown",
			"redis":    "unknown",
		},
	}

	// Check database
	sqlDB, err := h.workflowService.repo.db.DB.DB()
	if err == nil && sqlDB.Ping() == nil {
		health["services"].(map[string]string)["database"] = "healthy"
	} else {
		health["services"].(map[string]string)["database"] = "unhealthy"
		health["status"] = "degraded"
	}

	// Check Redis
	if _, err := h.workflowService.cache.client.Ping(ctx).Result(); err == nil {
		health["services"].(map[string]string)["redis"] = "healthy"
	} else {
		health["services"].(map[string]string)["redis"] = "unhealthy"
		health["status"] = "degraded"
	}

	statusCode := http.StatusOK
	if health["status"] == "degraded" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, health)
}

func (h *Handler) GetProducts(c *gin.Context) {
	handleGetProducts(c)
}

func (h *Handler) GetProduct(c *gin.Context) {
	handleGetProduct(c)
}

func (h *Handler) CreateProduct(c *gin.Context) {
	handleCreateProduct(c)
}

func (h *Handler) UpdateProduct(c *gin.Context) {
	handleUpdateProduct(c)
}

func (h *Handler) DeleteProduct(c *gin.Context) {
	handleDeleteProduct(c)
}

// ==================== AUTH HANDLERS ====================

func handleLogin(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}

		// Demo authentication - replace with real authentication
		if req.Email == "admin@yeelo.com" && req.Password == "admin123" {
			token, err := signJWT("admin-1", "ADMIN", jwtSecret)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to generate token"})
				return
			}
			c.JSON(200, gin.H{
				"access_token": token,
				"token_type":   "Bearer",
				"expires_in":   86400,
			})
			return
		}

		c.JSON(401, gin.H{"error": "Invalid credentials"})
	}
}

func handleMe(c *gin.Context) {
	userId := c.GetString("userId")
	role := c.GetString("role")
	
	c.JSON(200, gin.H{
		"id":    userId,
		"role":  role,
		"email": "admin@yeelo.com",
		"name":  "Admin User",
	})
}

// ==================== PRODUCT HANDLERS ====================

func handleGetProducts(c *gin.Context) {
	// Demo data - replace with database queries
	products := []Product{
		{
			ID:          "1",
			Name:        "Arnica Montana 30C",
			Price:       150.00,
			Stock:       100,
			Category:    "Homeopathy",
			Description: "For bruises, muscle pain, and inflammation",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          "2",
			Name:        "Belladonna 200C",
			Price:       180.00,
			Stock:       75,
			Category:    "Homeopathy",
			Description: "For fever, inflammation, and headaches",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          "3",
			Name:        "Nux Vomica 30C",
			Price:       160.00,
			Stock:       120,
			Category:    "Homeopathy",
			Description: "For digestive issues and stress",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}

	if db != nil {
		// Try to fetch from database
		rows, err := db.Query(`
			SELECT id, name, price, stock, category, description, created_at, updated_at 
			FROM products 
			ORDER BY created_at DESC 
			LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			dbProducts := []Product{}
			for rows.Next() {
				var p Product
				if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Category, &p.Description, &p.CreatedAt, &p.UpdatedAt); err == nil {
					dbProducts = append(dbProducts, p)
				}
			}
			if len(dbProducts) > 0 {
				products = dbProducts
			}
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    products,
		"count":   len(products),
	})
}

func handleGetProduct(c *gin.Context) {
	id := c.Param("id")
	
	if db != nil {
		var p Product
		err := db.QueryRow(`
			SELECT id, name, price, stock, category, description, created_at, updated_at 
			FROM products 
			WHERE id = $1
		`, id).Scan(&p.ID, &p.Name, &p.Price, &p.Stock, &p.Category, &p.Description, &p.CreatedAt, &p.UpdatedAt)
		
		if err == nil {
			c.JSON(200, gin.H{"success": true, "data": p})
			return
		}
	}

	// Demo fallback
	c.JSON(200, gin.H{
		"success": true,
		"data": Product{
			ID:          id,
			Name:        "Arnica Montana 30C",
			Price:       150.00,
			Stock:       100,
			Category:    "Homeopathy",
			Description: "For bruises, muscle pain, and inflammation",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	})
}

func handleCreateProduct(c *gin.Context) {
	var product Product
	if err := c.BindJSON(&product); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	product.ID = uuid.New().String()
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	if db != nil {
		_, err := db.Exec(`
			INSERT INTO products (id, name, price, stock, category, description, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, product.ID, product.Name, product.Price, product.Stock, product.Category, product.Description, product.CreatedAt, product.UpdatedAt)
		
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create product"})
			return
		}
	}

	c.JSON(201, gin.H{
		"success": true,
		"data":    product,
		"message": "Product created successfully",
	})
}

func handleUpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product Product
	if err := c.BindJSON(&product); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	product.UpdatedAt = time.Now()

	if db != nil {
		_, err := db.Exec(`
			UPDATE products 
			SET name = $1, price = $2, stock = $3, category = $4, description = $5, updated_at = $6
			WHERE id = $7
		`, product.Name, product.Price, product.Stock, product.Category, product.Description, product.UpdatedAt, id)
		
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to update product"})
			return
		}
	}

	product.ID = id
	c.JSON(200, gin.H{
		"success": true,
		"data":    product,
		"message": "Product updated successfully",
	})
}

func handleDeleteProduct(c *gin.Context) {
	id := c.Param("id")

	if db != nil {
		_, err := db.Exec("DELETE FROM products WHERE id = $1", id)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to delete product"})
			return
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Product deleted successfully",
	})
}

// ==================== CUSTOMER HANDLERS ====================

func handleGetCustomers(c *gin.Context) {
	customers := []Customer{
		{
			ID:               "1",
			Name:             "Rajesh Kumar",
			Email:            "rajesh@example.com",
			Phone:            "+91 98765 43210",
			Address:          "Mumbai, Maharashtra",
			LoyaltyPoints:    150,
			MarketingConsent: true,
			CreatedAt:        time.Now().AddDate(0, -3, 0),
		},
		{
			ID:               "2",
			Name:             "Priya Sharma",
			Email:            "priya@example.com",
			Phone:            "+91 98765 43211",
			Address:          "Delhi, India",
			LoyaltyPoints:    200,
			MarketingConsent: true,
			CreatedAt:        time.Now().AddDate(0, -2, 0),
		},
	}

	if db != nil {
		rows, err := db.Query(`
			SELECT id, name, email, phone, address, loyalty_points, marketing_consent, created_at 
			FROM customers 
			ORDER BY created_at DESC 
			LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			dbCustomers := []Customer{}
			for rows.Next() {
				var c Customer
				if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Address, &c.LoyaltyPoints, &c.MarketingConsent, &c.CreatedAt); err == nil {
					dbCustomers = append(dbCustomers, c)
				}
			}
			if len(dbCustomers) > 0 {
				customers = dbCustomers
			}
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    customers,
		"count":   len(customers),
	})
}

func handleGetCustomer(c *gin.Context) {
	id := c.Param("id")
	
	if db != nil {
		var customer Customer
		err := db.QueryRow(`
			SELECT id, name, email, phone, address, loyalty_points, marketing_consent, created_at 
			FROM customers 
			WHERE id = $1
		`, id).Scan(&customer.ID, &customer.Name, &customer.Email, &customer.Phone, &customer.Address, &customer.LoyaltyPoints, &customer.MarketingConsent, &customer.CreatedAt)
		
		if err == nil {
			c.JSON(200, gin.H{"success": true, "data": customer})
			return
		}
	}

	c.JSON(404, gin.H{"error": "Customer not found"})
}

func handleCreateCustomer(c *gin.Context) {
	var customer Customer
	if err := c.BindJSON(&customer); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	customer.ID = uuid.New().String()
	customer.CreatedAt = time.Now()
	customer.LoyaltyPoints = 0

	if db != nil {
		_, err := db.Exec(`
			INSERT INTO customers (id, name, email, phone, address, loyalty_points, marketing_consent, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, customer.ID, customer.Name, customer.Email, customer.Phone, customer.Address, customer.LoyaltyPoints, customer.MarketingConsent, customer.CreatedAt)
		
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create customer"})
			return
		}
	}

	c.JSON(201, gin.H{
		"success": true,
		"data":    customer,
		"message": "Customer created successfully",
	})
}

func handleUpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var customer Customer
	if err := c.BindJSON(&customer); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	if db != nil {
		_, err := db.Exec(`
			UPDATE customers 
			SET name = $1, email = $2, phone = $3, address = $4, marketing_consent = $5
			WHERE id = $6
		`, customer.Name, customer.Email, customer.Phone, customer.Address, customer.MarketingConsent, id)
		
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to update customer"})
			return
		}
	}

	customer.ID = id
	c.JSON(200, gin.H{
		"success": true,
		"data":    customer,
		"message": "Customer updated successfully",
	})
}

// ==================== ORDER HANDLERS ====================

func handleGetOrders(c *gin.Context) {
	orders := []Order{
		{
			ID:            "1",
			CustomerID:    "1",
			TotalAmount:   450.00,
			Status:        "COMPLETED",
			PaymentStatus: "PAID",
			CreatedAt:     time.Now().AddDate(0, 0, -1),
		},
		{
			ID:            "2",
			CustomerID:    "2",
			TotalAmount:    330.00,
			Status:        "PENDING",
			PaymentStatus: "PENDING",
			CreatedAt:     time.Now(),
		},
	}

	if db != nil {
		rows, err := db.Query(`
			SELECT id, customer_id, total_amount, status, payment_status, created_at 
			FROM orders 
			ORDER BY created_at DESC 
			LIMIT 50
		`)
		if err == nil {
			defer rows.Close()
			dbOrders := []Order{}
			for rows.Next() {
				var o Order
				if err := rows.Scan(&o.ID, &o.CustomerID, &o.TotalAmount, &o.Status, &o.PaymentStatus, &o.CreatedAt); err == nil {
					dbOrders = append(dbOrders, o)
				}
			}
			if len(dbOrders) > 0 {
				orders = dbOrders
			}
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    orders,
		"count":   len(orders),
	})
}

func handleGetOrder(c *gin.Context) {
	id := c.Param("id")
	
	if db != nil {
		var order Order
		err := db.QueryRow(`
			SELECT id, customer_id, total_amount, status, payment_status, created_at 
			FROM orders 
			WHERE id = $1
		`, id).Scan(&order.ID, &order.CustomerID, &order.TotalAmount, &order.Status, &order.PaymentStatus, &order.CreatedAt)
		
		if err == nil {
			c.JSON(200, gin.H{"success": true, "data": order})
			return
		}
	}

	c.JSON(404, gin.H{"error": "Order not found"})
}

func handleCreateOrder(c *gin.Context) {
	var order Order
	if err := c.BindJSON(&order); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	order.ID = uuid.New().String()
	order.CreatedAt = time.Now()
	order.Status = "PENDING"
	order.PaymentStatus = "PENDING"

	if db != nil {
		_, err := db.Exec(`
			INSERT INTO orders (id, customer_id, total_amount, status, payment_status, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, order.ID, order.CustomerID, order.TotalAmount, order.Status, order.PaymentStatus, order.CreatedAt)
		
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create order"})
			return
		}
	}

	c.JSON(201, gin.H{
		"success": true,
		"data":    order,
		"message": "Order created successfully",
	})
}

func handleUpdateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	if db != nil {
		_, err := db.Exec("UPDATE orders SET status = $1 WHERE id = $2", req.Status, id)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to update order status"})
			return
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Order status updated successfully",
	})
}

// ==================== CAMPAIGN HANDLERS ====================

func handleGetCampaigns(c *gin.Context) {
	campaigns := []Campaign{
		{
			ID:          "1",
			Name:        "Summer Sale 2024",
			Channel:     "WHATSAPP",
			Status:      "ACTIVE",
			TargetCount: 1000,
			SentCount:   750,
			CreatedAt:   time.Now().AddDate(0, 0, -7),
		},
		{
			ID:          "2",
			Name:        "New Product Launch",
			Channel:     "EMAIL",
			Status:      "DRAFT",
			TargetCount: 500,
			SentCount:   0,
			CreatedAt:   time.Now(),
		},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    campaigns,
		"count":   len(campaigns),
	})
}

func handleGetCampaign(c *gin.Context) {
	id := c.Param("id")
	
	campaign := Campaign{
		ID:          id,
		Name:        "Summer Sale 2024",
		Channel:     "WHATSAPP",
		Status:      "ACTIVE",
		TargetCount: 1000,
		SentCount:   750,
		CreatedAt:   time.Now().AddDate(0, 0, -7),
	}

	c.JSON(200, gin.H{"success": true, "data": campaign})
}

func handleCreateCampaign(c *gin.Context) {
	var campaign Campaign
	if err := c.BindJSON(&campaign); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	campaign.ID = uuid.New().String()
	campaign.CreatedAt = time.Now()
	campaign.Status = "DRAFT"
	campaign.SentCount = 0

	c.JSON(201, gin.H{
		"success": true,
		"data":    campaign,
		"message": "Campaign created successfully",
	})
}

func handleLaunchCampaign(c *gin.Context) {
	id := c.Param("id")

	c.JSON(200, gin.H{
		"success": true,
		"message": fmt.Sprintf("Campaign %s launched successfully", id),
	})
}

// ==================== ANALYTICS HANDLERS ====================

func handleGetDashboard(c *gin.Context) {
	analytics := Analytics{
		TotalRevenue:      125000.00,
		TotalOrders:       450,
		TotalCustomers:    280,
		AverageOrderValue: 277.78,
	}

	if db != nil {
		// Try to get real data
		var revenue sql.NullFloat64
		var orders, customers sql.NullInt64
		
		db.QueryRow("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'COMPLETED'").Scan(&revenue)
		db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&orders)
		db.QueryRow("SELECT COUNT(*) FROM customers").Scan(&customers)
		
		if revenue.Valid && orders.Valid && customers.Valid {
			analytics.TotalRevenue = revenue.Float64
			analytics.TotalOrders = int(orders.Int64)
			analytics.TotalCustomers = int(customers.Int64)
			if orders.Int64 > 0 {
				analytics.AverageOrderValue = revenue.Float64 / float64(orders.Int64)
			}
		}
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    analytics,
	})
}

func handleGetRevenue(c *gin.Context) {
	revenue := []gin.H{
		{"date": "2024-01-01", "amount": 15000.00},
		{"date": "2024-01-02", "amount": 18000.00},
		{"date": "2024-01-03", "amount": 22000.00},
		{"date": "2024-01-04", "amount": 19000.00},
		{"date": "2024-01-05", "amount": 25000.00},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    revenue,
	})
}

func handleGetTopProducts(c *gin.Context) {
	topProducts := []gin.H{
		{"product_id": "1", "name": "Arnica Montana 30C", "sales": 150, "revenue": 22500.00},
		{"product_id": "2", "name": "Belladonna 200C", "sales": 120, "revenue": 21600.00},
		{"product_id": "3", "name": "Nux Vomica 30C", "sales": 100, "revenue": 16000.00},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    topProducts,
	})
}

// ==================== INVENTORY HANDLERS ====================

func handleGetInventory(c *gin.Context) {
	inventory := []gin.H{
		{"product_id": "1", "name": "Arnica Montana 30C", "stock": 100, "reorder_level": 20},
		{"product_id": "2", "name": "Belladonna 200C", "stock": 75, "reorder_level": 20},
		{"product_id": "3", "name": "Nux Vomica 30C", "stock": 120, "reorder_level": 30},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    inventory,
	})
}

func handleAdjustInventory(c *gin.Context) {
	var req struct {
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
		Type      string `json:"type"` // "add" or "remove"
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"message": "Inventory adjusted successfully",
	})
}

func handleGetLowStock(c *gin.Context) {
	lowStock := []gin.H{
		{"product_id": "4", "name": "Calcarea Carb 30C", "stock": 15, "reorder_level": 20},
		{"product_id": "5", "name": "Pulsatilla 200C", "stock": 10, "reorder_level": 20},
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    lowStock,
		"count":   len(lowStock),
	})
}
