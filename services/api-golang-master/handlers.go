package main

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Order struct for order handlers
type Order struct {
	ID            string    `json:"id"`
	CustomerID    string    `json:"customer_id"`
	TotalAmount   float64   `json:"total_amount"`
	Status        string    `json:"status"`
	PaymentStatus string    `json:"payment_status"`
	CreatedAt     time.Time `json:"created_at"`
}
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

		// Super Admin authentication
		if req.Email == "medicine@yeelohomeopathy.com" && req.Password == "Medicine@2024" {
			token, err := signJWT("superadmin-1", "SUPERADMIN", jwtSecret)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to generate token"})
				return
			}
			c.JSON(200, gin.H{
				"token": token,
				"expiresAt": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
				"user": gin.H{
					"id":          "superadmin-1",
					"email":       "medicine@yeelohomeopathy.com",
					"displayName": "Super Admin",
					"firstName":   "Super",
					"lastName":    "Admin",
					"role":        "SUPERADMIN",
					"isSuperAdmin": true,
				},
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

		// Super Admin authentication
		if req.Email == "medicine@yeelohomeopathy.com" && req.Password == "Medicine@2024" {
			token, err := signJWT("superadmin-1", "SUPERADMIN", jwtSecret)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to generate token"})
				return
			}
			c.JSON(200, gin.H{
				"token": token,
				"expiresAt": time.Now().Add(24 * time.Hour).Format(time.RFC3339),
				"user": gin.H{
					"id":          "superadmin-1",
					"email":       "medicine@yeelohomeopathy.com",
					"displayName": "Super Admin",
					"firstName":   "Super",
					"lastName":    "Admin",
					"role":        "SUPERADMIN",
					"isSuperAdmin": true,
				},
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
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products endpoint for product data",
	})
}

func handleGetProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products/:id endpoint for product data",
	})
}

func handleCreateProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products endpoint for creating products",
	})
}

func handleUpdateProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products/:id endpoint for updating products",
	})
}

func handleDeleteProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products/:id endpoint for deleting products",
	})
}

func handleGetProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products/:id endpoint for product data",
	})
}

func handleCreateProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products endpoint for creating products",
	})
}

func handleUpdateProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products/:id endpoint for updating products",
	})
}

func handleDeleteProduct(c *gin.Context) {
	// Handled by product service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/products/:id endpoint for deleting products",
	})
}

func handleGetCustomers(c *gin.Context) {
	// Handled by customer service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/customers endpoint for customer data",
	})
}

func handleGetCustomer(c *gin.Context) {
	// Handled by customer service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/customers/:id endpoint for customer data",
	})
}

func handleCreateCustomer(c *gin.Context) {
	// Handled by customer service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/customers endpoint for creating customers",
	})
}

func handleUpdateCustomer(c *gin.Context) {
	// Handled by customer service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/customers/:id endpoint for updating customers",
	})
}

func handleGetOrders(c *gin.Context) {
	// Handled by sales service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/orders endpoint for order data",
	})
}

func handleGetOrder(c *gin.Context) {
	// Handled by sales service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/orders/:id endpoint for order data",
	})
}

func handleCreateOrder(c *gin.Context) {
	// Handled by sales service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/orders endpoint for creating orders",
	})
}

func handleUpdateOrderStatus(c *gin.Context) {
	// Handled by sales service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/orders/:id/status endpoint for updating order status",
	})
}

func handleGetCampaigns(c *gin.Context) {
	// Handled by marketing service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/campaigns endpoint for campaign data",
	})
}

func handleGetCampaign(c *gin.Context) {
	// Handled by marketing service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/campaigns/:id endpoint for campaign data",
	})
}

func handleCreateCampaign(c *gin.Context) {
	// Handled by marketing service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/campaigns endpoint for creating campaigns",
	})
}

func handleLaunchCampaign(c *gin.Context) {
	// Handled by marketing service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/campaigns/:id/launch endpoint for launching campaigns",
	})
}

func handleGetDashboard(c *gin.Context) {
	// Handled by analytics service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/analytics/dashboard endpoint for dashboard data",
	})
}

func handleGetRevenue(c *gin.Context) {
	// Handled by analytics service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/analytics/revenue endpoint for revenue data",
	})
}

func handleGetTopProducts(c *gin.Context) {
	// Handled by analytics service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/analytics/top-products endpoint for top products data",
	})
}

func handleGetInventory(c *gin.Context) {
	// Handled by inventory service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/inventory endpoint for inventory data",
	})
}

func handleAdjustInventory(c *gin.Context) {
	// Handled by inventory service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/inventory/:id/stock endpoint for adjusting inventory",
	})
}

func handleGetLowStock(c *gin.Context) {
	// Handled by inventory service - redirect to service layer
	c.JSON(200, gin.H{
		"success": true,
		"message": "Use /api/inventory/low-stock endpoint for low stock data",
	})
}
