package handlers

import (
	"net/http"
	"strconv"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"github.com/google/uuid"
)

// CustomerHandler handles all customer-related operations
type CustomerHandler struct {
	customerService *services.CustomerService
}

// NewCustomerHandler creates a new customer handler
func NewCustomerHandler() *CustomerHandler {
	return &CustomerHandler{
		customerService: services.NewCustomerService(),
	}
}

// ListCustomers returns paginated list of customers
func (h *CustomerHandler) ListCustomers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	groupID := c.Query("group_id")

	customers, total, err := h.customerService.ListCustomers(page, limit, search, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetCustomer returns a single customer by ID
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	customer, err := h.customerService.GetCustomerByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

// CreateCustomer creates a new customer
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var req CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customer := &models.Customer{
		ID:             uuid.New().String(),
		Name:           req.Name,
		Email:          req.Email,
		Phone:          req.Phone,
		Address:        req.Address,
		City:           req.City,
		State:          req.State,
		Pincode:        req.Pincode,
		GSTNumber:      req.GSTNumber,
		CustomerGroupID: req.CustomerGroupID,
		CreditLimit:    req.CreditLimit,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := h.customerService.CreateCustomer(customer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer created successfully",
		"customer": customer,
	})
}

// UpdateCustomer updates an existing customer
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	var req UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if req.City != "" {
		updates["city"] = req.City
	}
	if req.State != "" {
		updates["state"] = req.State
	}
	if req.Pincode != "" {
		updates["pincode"] = req.Pincode
	}
	if req.GSTNumber != "" {
		updates["gst_number"] = req.GSTNumber
	}
	if req.CustomerGroupID != "" {
		updates["customer_group_id"] = req.CustomerGroupID
	}
	if req.CreditLimit != nil {
		updates["credit_limit"] = *req.CreditLimit
	}
	updates["updated_at"] = time.Now()

	if err := h.customerService.UpdateCustomer(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer updated successfully"})
}

// DeleteCustomer soft deletes a customer
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer ID is required"})
		return
	}

	if err := h.customerService.DeleteCustomer(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// Request/Response structs
type CreateCustomerRequest struct {
	Name            string   `json:"name" binding:"required"`
	Email           string   `json:"email" binding:"required,email"`
	Phone           string   `json:"phone"`
	Address         string   `json:"address"`
	City            string   `json:"city"`
	State           string   `json:"state"`
	Pincode         string   `json:"pincode"`
	GSTNumber       string   `json:"gstNumber"`
	CustomerGroupID string   `json:"customerGroupId"`
	CreditLimit     *float64 `json:"creditLimit"`
}

type UpdateCustomerRequest struct {
	Name            string   `json:"name"`
	Email           string   `json:"email"`
	Phone           string   `json:"phone"`
	Address         string   `json:"address"`
	City            string   `json:"city"`
	State           string   `json:"state"`
	Pincode         string   `json:"pincode"`
	GSTNumber       string   `json:"gstNumber"`
	CustomerGroupID string   `json:"customerGroupId"`
	CreditLimit     *float64 `json:"creditLimit"`
}

// VendorHandler handles all vendor-related operations
type VendorHandler struct {
	vendorService *services.VendorService
}

// NewVendorHandler creates a new vendor handler
func NewVendorHandler() *VendorHandler {
	return &VendorHandler{
		vendorService: services.NewVendorService(),
	}
}

// ListVendors returns paginated list of vendors
func (h *VendorHandler) ListVendors(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	vendors, total, err := h.vendorService.ListVendors(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch vendors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"vendors": vendors,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// CreateVendor creates a new vendor
func (h *VendorHandler) CreateVendor(c *gin.Context) {
	var req CreateVendorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vendor := &models.Vendor{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Email:     req.Email,
		Phone:     req.Phone,
		Address:   req.Address,
		City:      req.City,
		State:     req.State,
		Pincode:   req.Pincode,
		GSTNumber: req.GSTNumber,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.vendorService.CreateVendor(vendor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vendor"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Vendor created successfully",
		"vendor": vendor,
	})
}

// Request/Response structs
type CreateVendorRequest struct {
	Name      string `json:"name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	City      string `json:"city"`
	State     string `json:"state"`
	Pincode   string `json:"pincode"`
	GSTNumber string `json:"gstNumber"`
}

// HRHandler handles all HR-related operations
type HRHandler struct {
	hrService *services.HRService
}

// NewHRHandler creates a new HR handler
func NewHRHandler() *HRHandler {
	return &HRHandler{
		hrService: services.NewHRService(),
	}
}

// ListEmployees returns paginated list of employees
func (h *HRHandler) ListEmployees(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	departmentID := c.Query("department_id")

	employees, total, err := h.hrService.ListEmployees(page, limit, search, departmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"employees": employees,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// CreateEmployee creates a new employee
func (h *HRHandler) CreateEmployee(c *gin.Context) {
	var req CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee := &models.Employee{
		ID:           uuid.New().String(),
		UserID:       req.UserID,
		EmployeeCode: req.EmployeeCode,
		DepartmentID: req.DepartmentID,
		DesignationID: req.DesignationID,
		ShiftID:      req.ShiftID,
		JoiningDate:  req.JoiningDate,
		Salary:       req.Salary,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.hrService.CreateEmployee(employee); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employee"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Employee created successfully",
		"employee": employee,
	})
}

// Request/Response structs
type CreateEmployeeRequest struct {
	UserID        string    `json:"userId" binding:"required"`
	EmployeeCode  string    `json:"employeeCode" binding:"required"`
	DepartmentID  string    `json:"departmentId" binding:"required"`
	DesignationID string    `json:"designationId" binding:"required"`
	ShiftID       string    `json:"shiftId"`
	JoiningDate   time.Time `json:"joiningDate" binding:"required"`
	Salary        float64   `json:"salary" binding:"required"`
}

// FinanceHandler handles all finance-related operations
type FinanceHandler struct {
	financeService *services.FinanceService
}

// NewFinanceHandler creates a new finance handler
func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{
		financeService: services.NewFinanceService(),
	}
}

// GetLedgerBalance returns ledger balance
func (h *FinanceHandler) GetLedgerBalance(c *gin.Context) {
	ledgerID := c.Param("ledger_id")
	if ledgerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ledger ID is required"})
		return
	}

	balance, err := h.financeService.GetLedgerBalance(ledgerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get ledger balance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ledger_id": ledgerID,
		"balance":   balance,
	})
}

// CreateExpense creates a new expense
func (h *FinanceHandler) CreateExpense(c *gin.Context) {
	var req CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	expense := &models.Expense{
		ID:              uuid.New().String(),
		ExpenseNumber:   "EXP" + time.Now().Format("20060102") + strconv.Itoa(int(time.Now().Unix()%1000)),
		ExpenseCategoryID: req.ExpenseCategoryID,
		CostCenterID:    req.CostCenterID,
		LedgerID:        req.LedgerID,
		Amount:          req.Amount,
		Description:     req.Description,
		ExpenseDate:     req.ExpenseDate,
		VendorID:        req.VendorID,
		Receipt:         req.Receipt,
		Status:          "DRAFT",
		CreatedBy:       c.GetString("user_id"),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := h.financeService.CreateExpense(expense); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create expense"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Expense created successfully",
		"expense": expense,
	})
}

// Request/Response structs
type CreateExpenseRequest struct {
	ExpenseCategoryID string    `json:"expenseCategoryId" binding:"required"`
	CostCenterID      string    `json:"costCenterId"`
	LedgerID          string    `json:"ledgerId" binding:"required"`
	Amount            float64   `json:"amount" binding:"required,gt=0"`
	Description       string    `json:"description" binding:"required"`
	ExpenseDate       time.Time `json:"expenseDate" binding:"required"`
	VendorID          *string   `json:"vendorId"`
	Receipt           string    `json:"receipt"`
}

// ReportsHandler handles all report-related operations
type ReportsHandler struct {
	reportsService *services.ReportsService
}

// NewReportsHandler creates a new reports handler
func NewReportsHandler() *ReportsHandler {
	return &ReportsHandler{
		reportsService: services.NewReportsService(),
	}
}

// GetSalesReport returns sales analytics report
func (h *ReportsHandler) GetSalesReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	groupBy := c.DefaultQuery("group_by", "day")

	report, err := h.reportsService.GetSalesReport(startDate, endDate, groupBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate sales report"})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetInventoryReport returns inventory analytics report
func (h *ReportsHandler) GetInventoryReport(c *gin.Context) {
	warehouseID := c.Query("warehouse_id")

	report, err := h.reportsService.GetInventoryReport(warehouseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate inventory report"})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetFinancialReport returns financial analytics report
func (h *ReportsHandler) GetFinancialReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	report, err := h.reportsService.GetFinancialReport(startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate financial report"})
		return
	}

	c.JSON(http.StatusOK, report)
}
