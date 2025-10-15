// =============================================
// COMPREHENSIVE MASTER DATA API HANDLERS
// =============================================
// All CRUD API endpoints for master data management

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

// ==================== BASE MASTER HANDLER ====================

// MasterHandler handles all master data operations
type MasterHandler struct {
	companyService      *CompanyService
	branchService       *BranchService
	departmentService   *DepartmentService
	roleService         *RoleService
	userService         *UserService
	currencyService     *CurrencyService
	taxService          *TaxService
	uomService          *UOMService
	paymentMethodService *PaymentMethodService
	notificationService *NotificationService
	aiModelService      *AIModelService
	integrationService  *IntegrationService
	productService      *ProductService
	skuService          *SKUService
	categoryService     *CategoryService
	subcategoryService  *SubcategoryService
	brandService        *BrandService
	groupService        *GroupService
	potencyService      *PotencyService
	sizeService         *SizeService
	variantService      *VariantService
	batchService        *BatchService
	locationService     *LocationService
	warehouseService    *WarehouseService
	hsnService          *HSNService
	priceListService    *PriceListService
	discountService     *DiscountService
	salesTypeService    *SalesTypeService
	invoiceSeriesService *InvoiceSeriesService
	priceLevelService   *PriceLevelService
	salespersonService  *SalespersonService
	paymentTermService  *PaymentTermService
	creditLimitService  *CreditLimitService
	posSettingService   *POSSettingService
	einvoiceService     *EInvoiceService
	returnReasonService *ReturnReasonService
	vendorService       *VendorService
	vendorTypeService   *VendorTypeService
	poTermService       *POTermService
	poStatusService     *POStatusService
	freightService      *FreightService
	purchaseReturnService *PurchaseReturnService
	grnTemplateService  *GRNTemplateService
	customerService     *CustomerService
	customerGroupService *CustomerGroupService
	contactTypeService  *ContactTypeService
	addressBookService  *AddressBookService
	loyaltyProgramService *LoyaltyProgramService
	feedbackTypeService *FeedbackTypeService
	leadSourceService   *LeadSourceService
	followUpStatusService *FollowUpStatusService
	ticketCategoryService *TicketCategoryService
	employeeService     *EmployeeService
	designationService  *DesignationService
	shiftService        *ShiftService
	attendanceRuleService *AttendanceRuleService
	leaveTypeService    *LeaveTypeService
	salaryStructureService *SalaryStructureService
	commissionRuleService *CommissionRuleService
	performanceMetricService *PerformanceMetricService
	ledgerService       *LedgerService
	costCenterService   *CostCenterService
	paymentVoucherService *PaymentVoucherService
	expenseCategoryService *ExpenseCategoryService
	gstReturnPeriodService *GSTReturnPeriodService
	bankService         *BankService
	chequeBookService   *ChequeBookService
	campaignTypeService *CampaignTypeService
	templateService     *TemplateService
	offerService        *OfferService
	targetSegmentService *TargetSegmentService
	channelConfigService *ChannelConfigService
	postSchedulerService *PostSchedulerService
	aiPromptTemplateService *AIPromptTemplateService
	festivalService     *FestivalService
	socialAccountService *SocialAccountService
	hashtagLibraryService *HashtagLibraryService
	blogCategoryService *BlogCategoryService
	autoPostScheduleService *AutoPostScheduleService
	mediaLibraryService *MediaLibraryService
	workflowRuleService *WorkflowRuleService
	aiAgentService      *AIAgentService
	aiTaskService       *AITaskService
	aiPromptLibraryService *AIPromptLibraryService
	modelVersionService *ModelVersionService
	vectorIndexService  *VectorIndexService
	aiActionTemplateService *AIActionTemplateService
	businessRuleService *BusinessRuleService
	systemSettingService *SystemSettingService
	gatewayConfigService *GatewayConfigService
	whatsappConfigService *WhatsAppConfigService
	backupSettingService *BackupSettingService
	notificationPreferenceService *NotificationPreferenceService
	auditLogSettingService *AuditLogSettingService
	securityPolicyService *SecurityPolicyService
	userProfileService  *UserProfileService
	permissionService   *PermissionService
	activityLogService  *ActivityLogService
	twoFactorService    *TwoFactorService
	sessionService      *SessionService
}

// NewMasterHandler creates a new master handler instance
func NewMasterHandler(
	companyService *CompanyService,
	branchService *BranchService,
	departmentService *DepartmentService,
	roleService *RoleService,
	userService *UserService,
	currencyService *CurrencyService,
	taxService *TaxService,
	uomService *UOMService,
	paymentMethodService *PaymentMethodService,
	notificationService *NotificationService,
	aiModelService *AIModelService,
	integrationService *IntegrationService,
	productService *ProductService,
	skuService *SKUService,
	categoryService *CategoryService,
	subcategoryService *SubcategoryService,
	brandService *BrandService,
	groupService *GroupService,
	potencyService *PotencyService,
	sizeService *SizeService,
	variantService *VariantService,
	batchService *BatchService,
	locationService *LocationService,
	warehouseService *WarehouseService,
	hsnService *HSNService,
	priceListService *PriceListService,
	discountService *DiscountService,
	salesTypeService *SalesTypeService,
	invoiceSeriesService *InvoiceSeriesService,
	priceLevelService *PriceLevelService,
	salespersonService *SalespersonService,
	paymentTermService *PaymentTermService,
	creditLimitService *CreditLimitService,
	posSettingService *POSSettingService,
	einvoiceService *EInvoiceService,
	returnReasonService *ReturnReasonService,
	vendorService *VendorService,
	vendorTypeService *VendorTypeService,
	poTermService *POTermService,
	poStatusService *POStatusService,
	freightService *FreightService,
	purchaseReturnService *PurchaseReturnService,
	grnTemplateService *GRNTemplateService,
	customerService *CustomerService,
	customerGroupService *CustomerGroupService,
	contactTypeService *ContactTypeService,
	addressBookService *AddressBookService,
	loyaltyProgramService *LoyaltyProgramService,
	feedbackTypeService *FeedbackTypeService,
	leadSourceService *LeadSourceService,
	followUpStatusService *FollowUpStatusService,
	ticketCategoryService *TicketCategoryService,
	employeeService *EmployeeService,
	designationService *DesignationService,
	shiftService *ShiftService,
	attendanceRuleService *AttendanceRuleService,
	leaveTypeService *LeaveTypeService,
	salaryStructureService *SalaryStructureService,
	commissionRuleService *CommissionRuleService,
	performanceMetricService *PerformanceMetricService,
	ledgerService *LedgerService,
	costCenterService *CostCenterService,
	paymentVoucherService *PaymentVoucherService,
	expenseCategoryService *ExpenseCategoryService,
	gstReturnPeriodService *GSTReturnPeriodService,
	bankService *BankService,
	chequeBookService *ChequeBookService,
	campaignTypeService *CampaignTypeService,
	templateService *TemplateService,
	offerService *OfferService,
	targetSegmentService *TargetSegmentService,
	channelConfigService *ChannelConfigService,
	postSchedulerService *PostSchedulerService,
	aiPromptTemplateService *AIPromptTemplateService,
	festivalService *FestivalService,
	socialAccountService *SocialAccountService,
	hashtagLibraryService *HashtagLibraryService,
	blogCategoryService *BlogCategoryService,
	autoPostScheduleService *AutoPostScheduleService,
	mediaLibraryService *MediaLibraryService,
	workflowRuleService *WorkflowRuleService,
	aiAgentService *AIAgentService,
	aiTaskService *AITaskService,
	aiPromptLibraryService *AIPromptLibraryService,
	modelVersionService *ModelVersionService,
	vectorIndexService *VectorIndexService,
	aiActionTemplateService *AIActionTemplateService,
	businessRuleService *BusinessRuleService,
	systemSettingService *SystemSettingService,
	gatewayConfigService *GatewayConfigService,
	whatsappConfigService *WhatsAppConfigService,
	backupSettingService *BackupSettingService,
	notificationPreferenceService *NotificationPreferenceService,
	auditLogSettingService *AuditLogSettingService,
	securityPolicyService *SecurityPolicyService,
	userProfileService *UserProfileService,
	permissionService *PermissionService,
	activityLogService *ActivityLogService,
	twoFactorService *TwoFactorService,
	sessionService *SessionService,
) *MasterHandler {
	return &MasterHandler{
		companyService:      companyService,
		branchService:       branchService,
		departmentService:   departmentService,
		roleService:         roleService,
		userService:         userService,
		currencyService:     currencyService,
		taxService:          taxService,
		uomService:          uomService,
		paymentMethodService: paymentMethodService,
		notificationService: notificationService,
		aiModelService:      aiModelService,
		integrationService:  integrationService,
		productService:      productService,
		skuService:          skuService,
		categoryService:     categoryService,
		subcategoryService:  subcategoryService,
		brandService:        brandService,
		groupService:        groupService,
		potencyService:      potencyService,
		sizeService:         sizeService,
		variantService:      variantService,
		batchService:        batchService,
		locationService:     locationService,
		warehouseService:    warehouseService,
		hsnService:          hsnService,
		priceListService:    priceListService,
		discountService:     discountService,
		salesTypeService:    salesTypeService,
		invoiceSeriesService: invoiceSeriesService,
		priceLevelService:   priceLevelService,
		salespersonService:  salespersonService,
		paymentTermService:  paymentTermService,
		creditLimitService:  creditLimitService,
		posSettingService:   posSettingService,
		einvoiceService:     einvoiceService,
		returnReasonService: returnReasonService,
		vendorService:       vendorService,
		vendorTypeService:   vendorTypeService,
		poTermService:       poTermService,
		poStatusService:     poStatusService,
		freightService:      freightService,
		purchaseReturnService: purchaseReturnService,
		grnTemplateService:  grnTemplateService,
		customerService:     customerService,
		customerGroupService: customerGroupService,
		contactTypeService:  contactTypeService,
		addressBookService:  addressBookService,
		loyaltyProgramService: loyaltyProgramService,
		feedbackTypeService: feedbackTypeService,
		leadSourceService:   leadSourceService,
		followUpStatusService: followUpStatusService,
		ticketCategoryService: ticketCategoryService,
		employeeService:     employeeService,
		designationService:  designationService,
		shiftService:        shiftService,
		attendanceRuleService: attendanceRuleService,
		leaveTypeService:    leaveTypeService,
		salaryStructureService: salaryStructureService,
		commissionRuleService: commissionRuleService,
		performanceMetricService: performanceMetricService,
		ledgerService:       ledgerService,
		costCenterService:   costCenterService,
		paymentVoucherService: paymentVoucherService,
		expenseCategoryService: expenseCategoryService,
		gstReturnPeriodService: gstReturnPeriodService,
		bankService:         bankService,
		chequeBookService:   chequeBookService,
		campaignTypeService: campaignTypeService,
		templateService:     templateService,
		offerService:        offerService,
		targetSegmentService: targetSegmentService,
		channelConfigService: channelConfigService,
		postSchedulerService: postSchedulerService,
		aiPromptTemplateService: aiPromptTemplateService,
		festivalService:     festivalService,
		socialAccountService: socialAccountService,
		hashtagLibraryService: hashtagLibraryService,
		blogCategoryService: blogCategoryService,
		autoPostScheduleService: autoPostScheduleService,
		mediaLibraryService: mediaLibraryService,
		workflowRuleService: workflowRuleService,
		aiAgentService:      aiAgentService,
		aiTaskService:       aiTaskService,
		aiPromptLibraryService: aiPromptLibraryService,
		modelVersionService: modelVersionService,
		vectorIndexService:  vectorIndexService,
		aiActionTemplateService: aiActionTemplateService,
		businessRuleService: businessRuleService,
		systemSettingService: systemSettingService,
		gatewayConfigService: gatewayConfigService,
		whatsappConfigService: whatsappConfigService,
		backupSettingService: backupSettingService,
		notificationPreferenceService: notificationPreferenceService,
		auditLogSettingService: auditLogSettingService,
		securityPolicyService: securityPolicyService,
		userProfileService:  userProfileService,
		permissionService:   permissionService,
		activityLogService:  activityLogService,
		twoFactorService:    twoFactorService,
		sessionService:      sessionService,
	}
}

// ==================== GENERIC CRUD HELPERS ====================

// Generic response structures
type ListResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    string `json:"code"`
}

// Helper function to get pagination parameters
func getPaginationParams(c *gin.Context) (page, perPage int) {
	page = 1
	perPage = 20

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if pp := c.Query("per_page"); pp != "" {
		if parsed, err := strconv.Atoi(pp); err == nil && parsed > 0 && parsed <= 100 {
			perPage = parsed
		}
	}

	return page, perPage
}

// Helper function to get user ID from JWT token
func getUserIDFromToken(c *gin.Context) string {
	tokenString := c.GetHeader("Authorization")
	if tokenString == "" {
		return ""
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("your-secret-key"), nil // Replace with actual secret
	})

	if err != nil || !token.Valid {
		return ""
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if sub, ok := claims["sub"].(string); ok {
			return sub
		}
	}

	return ""
}

// ==================== SYSTEM-WIDE MASTERS API ====================

// Company Profile CRUD
func (h *MasterHandler) GetCompanies(c *gin.Context) {
	ctx := context.Background()
	companies, err := h.companyService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch companies", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": companies})
}

func (h *MasterHandler) GetCompany(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	company, err := h.companyService.GetByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch company", Message: err.Error()})
		return
	}

	if company == nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: "Company not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": company})
}

func (h *MasterHandler) CreateCompany(c *gin.Context) {
	ctx := context.Background()
	var company CompanyProfile

	if err := c.ShouldBindJSON(&company); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.companyService.Create(ctx, &company)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create company", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Company created successfully"})
}

func (h *MasterHandler) UpdateCompany(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")
	var company CompanyProfile

	if err := c.ShouldBindJSON(&company); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	updated, err := h.companyService.Update(ctx, id, &company)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update company", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated, "message": "Company updated successfully"})
}

func (h *MasterHandler) DeleteCompany(c *gin.Context) {
	ctx := context.Background()
	id := c.Param("id")

	err := h.companyService.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to delete company", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Company deleted successfully"})
}

// Branch CRUD
func (h *MasterHandler) GetBranches(c *gin.Context) {
	ctx := context.Background()
	branches, err := h.branchService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch branches", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": branches})
}

func (h *MasterHandler) CreateBranch(c *gin.Context) {
	ctx := context.Background()
	var branch Branch

	if err := c.ShouldBindJSON(&branch); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.branchService.Create(ctx, &branch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create branch", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Branch created successfully"})
}

// Department CRUD
func (h *MasterHandler) GetDepartments(c *gin.Context) {
	ctx := context.Background()
	departments, err := h.departmentService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch departments", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": departments})
}

func (h *MasterHandler) CreateDepartment(c *gin.Context) {
	ctx := context.Background()
	var department Department

	if err := c.ShouldBindJSON(&department); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.departmentService.Create(ctx, &department)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create department", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Department created successfully"})
}

// Role CRUD
func (h *MasterHandler) GetRoles(c *gin.Context) {
	ctx := context.Background()
	roles, err := h.roleService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch roles", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": roles})
}

func (h *MasterHandler) CreateRole(c *gin.Context) {
	ctx := context.Background()
	var role Role

	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.roleService.Create(ctx, &role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create role", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Role created successfully"})
}

// User CRUD
func (h *MasterHandler) GetUsers(c *gin.Context) {
	ctx := context.Background()
	users, err := h.userService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch users", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func (h *MasterHandler) CreateUser(c *gin.Context) {
	ctx := context.Background()
	var user User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	// Hash password before saving
	if user.Password != "" {
		// TODO: Hash password
	}

	created, err := h.userService.Create(ctx, &user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create user", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "User created successfully"})
}

// ==================== PRODUCT & INVENTORY MASTERS API ====================

// Product CRUD
func (h *MasterHandler) GetProducts(c *gin.Context) {
	ctx := context.Background()
	products, err := h.productService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch products", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": products})
}

func (h *MasterHandler) CreateProduct(c *gin.Context) {
	ctx := context.Background()
	var product Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.productService.Create(ctx, &product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create product", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Product created successfully"})
}

// Category CRUD
func (h *MasterHandler) GetCategories(c *gin.Context) {
	ctx := context.Background()
	categories, err := h.categoryService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch categories", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func (h *MasterHandler) CreateCategory(c *gin.Context) {
	ctx := context.Background()
	var category ProductCategory

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.categoryService.Create(ctx, &category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create category", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Category created successfully"})
}

// Brand CRUD
func (h *MasterHandler) GetBrands(c *gin.Context) {
	ctx := context.Background()
	brands, err := h.brandService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch brands", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": brands})
}

func (h *MasterHandler) CreateBrand(c *gin.Context) {
	ctx := context.Background()
	var brand ProductBrand

	if err := c.ShouldBindJSON(&brand); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.brandService.Create(ctx, &brand)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create brand", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Brand created successfully"})
}

// ==================== SALES MASTERS API ====================

// Sales Type CRUD
func (h *MasterHandler) GetSalesTypes(c *gin.Context) {
	ctx := context.Background()
	salesTypes, err := h.salesTypeService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch sales types", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": salesTypes})
}

func (h *MasterHandler) CreateSalesType(c *gin.Context) {
	ctx := context.Background()
	var salesType SalesType

	if err := c.ShouldBindJSON(&salesType); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.salesTypeService.Create(ctx, &salesType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create sales type", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Sales type created successfully"})
}

// Invoice Series CRUD
func (h *MasterHandler) GetInvoiceSeries(c *gin.Context) {
	ctx := context.Background()
	invoiceSeries, err := h.invoiceSeriesService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch invoice series", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": invoiceSeries})
}

func (h *MasterHandler) CreateInvoiceSeries(c *gin.Context) {
	ctx := context.Background()
	var invoiceSeries InvoiceSeries

	if err := c.ShouldBindJSON(&invoiceSeries); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.invoiceSeriesService.Create(ctx, &invoiceSeries)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create invoice series", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Invoice series created successfully"})
}

// ==================== PURCHASE MASTERS API ====================

// Vendor CRUD
func (h *MasterHandler) GetVendors(c *gin.Context) {
	ctx := context.Background()
	vendors, err := h.vendorService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch vendors", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vendors})
}

func (h *MasterHandler) CreateVendor(c *gin.Context) {
	ctx := context.Background()
	var vendor Vendor

	if err := c.ShouldBindJSON(&vendor); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.vendorService.Create(ctx, &vendor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create vendor", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Vendor created successfully"})
}

// ==================== CUSTOMER / CRM MASTERS API ====================

// Customer CRUD
func (h *MasterHandler) GetCustomers(c *gin.Context) {
	ctx := context.Background()
	customers, err := h.customerService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch customers", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": customers})
}

func (h *MasterHandler) CreateCustomer(c *gin.Context) {
	ctx := context.Background()
	var customer Customer

	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.customerService.Create(ctx, &customer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create customer", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Customer created successfully"})
}

// ==================== HR & STAFF MASTERS API ====================

// Employee CRUD
func (h *MasterHandler) GetEmployees(c *gin.Context) {
	ctx := context.Background()
	employees, err := h.employeeService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch employees", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": employees})
}

func (h *MasterHandler) CreateEmployee(c *gin.Context) {
	ctx := context.Background()
	var employee Employee

	if err := c.ShouldBindJSON(&employee); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.employeeService.Create(ctx, &employee)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create employee", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Employee created successfully"})
}

// ==================== FINANCE & ACCOUNTING MASTERS API ====================

// Ledger CRUD
func (h *MasterHandler) GetLedgers(c *gin.Context) {
	ctx := context.Background()
	ledgers, err := h.ledgerService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch ledgers", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": ledgers})
}

func (h *MasterHandler) CreateLedger(c *gin.Context) {
	ctx := context.Background()
	var ledger Ledger

	if err := c.ShouldBindJSON(&ledger); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.ledgerService.Create(ctx, &ledger)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create ledger", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Ledger created successfully"})
}

// ==================== MARKETING & CAMPAIGN MASTERS API ====================

// Campaign Type CRUD
func (h *MasterHandler) GetCampaignTypes(c *gin.Context) {
	ctx := context.Background()
	campaignTypes, err := h.campaignTypeService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch campaign types", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": campaignTypes})
}

func (h *MasterHandler) CreateCampaignType(c *gin.Context) {
	ctx := context.Background()
	var campaignType CampaignType

	if err := c.ShouldBindJSON(&campaignType); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.campaignTypeService.Create(ctx, &campaignType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create campaign type", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Campaign type created successfully"})
}

// ==================== SOCIAL MEDIA & AUTOMATION MASTERS API ====================

// Social Account CRUD
func (h *MasterHandler) GetSocialAccounts(c *gin.Context) {
	ctx := context.Background()
	socialAccounts, err := h.socialAccountService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch social accounts", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": socialAccounts})
}

func (h *MasterHandler) CreateSocialAccount(c *gin.Context) {
	ctx := context.Background()
	var socialAccount SocialAccount

	if err := c.ShouldBindJSON(&socialAccount); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.socialAccountService.Create(ctx, &socialAccount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create social account", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Social account created successfully"})
}

// ==================== AI & INSIGHTS MASTERS API ====================

// AI Agent CRUD
func (h *MasterHandler) GetAIAgents(c *gin.Context) {
	ctx := context.Background()
	aiAgents, err := h.aiAgentService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch AI agents", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": aiAgents})
}

func (h *MasterHandler) CreateAIAgent(c *gin.Context) {
	ctx := context.Background()
	var aiAgent AIAgent

	if err := c.ShouldBindJSON(&aiAgent); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.aiAgentService.Create(ctx, &aiAgent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create AI agent", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "AI agent created successfully"})
}

// ==================== SETTINGS MASTERS API ====================

// System Setting CRUD
func (h *MasterHandler) GetSystemSettings(c *gin.Context) {
	ctx := context.Background()
	settings, err := h.systemSettingService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch system settings", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": settings})
}

func (h *MasterHandler) CreateSystemSetting(c *gin.Context) {
	ctx := context.Background()
	var setting SystemSetting

	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.systemSettingService.Create(ctx, &setting)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create system setting", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "System setting created successfully"})
}

// ==================== USER PROFILE / SECURITY MASTERS API ====================

// User Profile CRUD
func (h *MasterHandler) GetUserProfiles(c *gin.Context) {
	ctx := context.Background()
	profiles, err := h.userProfileService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch user profiles", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": profiles})
}

func (h *MasterHandler) CreateUserProfile(c *gin.Context) {
	ctx := context.Background()
	var profile UserProfile

	if err := c.ShouldBindJSON(&profile); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.userProfileService.Create(ctx, &profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create user profile", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "User profile created successfully"})
}

// Permission CRUD
func (h *MasterHandler) GetPermissions(c *gin.Context) {
	ctx := context.Background()
	permissions, err := h.permissionService.GetAll(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch permissions", Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": permissions})
}

func (h *MasterHandler) CreatePermission(c *gin.Context) {
	ctx := context.Background()
	var permission Permission

	if err := c.ShouldBindJSON(&permission); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request data", Message: err.Error()})
		return
	}

	created, err := h.permissionService.Create(ctx, &permission)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create permission", Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created, "message": "Permission created successfully"})
}
