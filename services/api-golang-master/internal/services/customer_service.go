// Customer Service - Complete CRM operations for Customer Management
// This service handles customers, loyalty programs, customer interactions, and CRM features

package main

import (
	"context"
	"fmt"
	"time"
)

// ==================== CUSTOMER SERVICE ====================

type CustomerService struct {
	db    *Database
	cache *CacheService
}

func NewCustomerService(db *Database, cache *CacheService) *CustomerService {
	return &CustomerService{db: db, cache: cache}
}

// ==================== CUSTOMER CRUD OPERATIONS ====================

func (s *CustomerService) GetCustomerByID(ctx context.Context, id string) (*Customer, error) {
	cacheKey := fmt.Sprintf("customer:%s", id)

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if customer, ok := cached.(*Customer); ok {
			return customer, nil
		}
	}

	var customer Customer
	if err := s.db.DB.WithContext(ctx).
		Preload("Groups").
		Preload("LoyaltyProgram").
		Where("id = ? AND is_active = ?", id, true).
		First(&customer).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}

	s.cache.Set(ctx, cacheKey, &customer, 5*time.Minute)
	return &customer, nil
}

func (s *CustomerService) GetCustomers(ctx context.Context, filters map[string]interface{}, limit, offset int) ([]Customer, int64, error) {
	var customers []Customer
	var total int64

	query := s.db.DB.WithContext(ctx).
		Preload("Groups").
		Preload("LoyaltyProgram").
		Model(&Customer{}).
		Where("is_active = ?", true)

	// Apply filters
	if search, ok := filters["search"].(string); ok && search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if groupID, ok := filters["group_id"].(string); ok && groupID != "" {
		query = query.Joins("JOIN customer_groups_customers cgc ON customers.id = cgc.customer_id").
			Where("cgc.customer_group_id = ?", groupID)
	}
	if loyaltyTier, ok := filters["loyalty_tier"].(string); ok && loyaltyTier != "" {
		query = query.Joins("JOIN loyalty_programs lp ON customers.loyalty_program_id = lp.id").
			Where("lp.tier = ?", loyaltyTier)
	}
	if city, ok := filters["city"].(string); ok && city != "" {
		query = query.Where("city = ?", city)
	}
	if state, ok := filters["state"].(string); ok && state != "" {
		query = query.Where("state = ?", state)
	}
	if minPoints, ok := filters["min_points"].(int); ok {
		query = query.Where("loyalty_points >= ?", minPoints)
	}
	if maxPoints, ok := filters["max_points"].(int); ok {
		query = query.Where("loyalty_points <= ?", maxPoints)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count customers: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("name ASC").
		Find(&customers).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get customers: %w", err)
	}

	return customers, total, nil
}

func (s *CustomerService) CreateCustomer(ctx context.Context, customer *Customer) (*Customer, error) {
	if err := s.db.DB.WithContext(ctx).Create(customer).Error; err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	// Clear cache
	cacheKey := "customers:*"
	s.cache.Delete(ctx, cacheKey)

	return customer, nil
}

func (s *CustomerService) UpdateCustomer(ctx context.Context, id string, updates map[string]interface{}) (*Customer, error) {
	if err := s.db.DB.WithContext(ctx).Model(&Customer{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update customer: %w", err)
	}

	// Clear cache
	cacheKey := "customers:*"
	s.cache.Delete(ctx, cacheKey)

	return s.GetCustomerByID(ctx, id)
}

func (s *CustomerService) DeleteCustomer(ctx context.Context, id string) error {
	if err := s.db.DB.WithContext(ctx).Model(&Customer{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete customer: %w", err)
	}

	// Clear cache
	cacheKey := "customers:*"
	s.cache.Delete(ctx, cacheKey)

	return nil
}

// ==================== CUSTOMER GROUP OPERATIONS ====================

func (s *CustomerService) GetCustomerGroups(ctx context.Context) ([]CustomerGroup, error) {
	cacheKey := "customer_groups"

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if groups, ok := cached.([]CustomerGroup); ok {
			return groups, nil
		}
	}

	var groups []CustomerGroup
	if err := s.db.DB.WithContext(ctx).Where("is_active = ?", true).Order("name ASC").Find(&groups).Error; err != nil {
		return nil, fmt.Errorf("failed to get customer groups: %w", err)
	}

	s.cache.Set(ctx, cacheKey, groups, 10*time.Minute)
	return groups, nil
}

func (s *CustomerService) CreateCustomerGroup(ctx context.Context, group *CustomerGroup) (*CustomerGroup, error) {
	if err := s.db.DB.WithContext(ctx).Create(group).Error; err != nil {
		return nil, fmt.Errorf("failed to create customer group: %w", err)
	}

	// Clear cache
	cacheKey := "customer_groups"
	s.cache.Delete(ctx, cacheKey)

	return group, nil
}

func (s *CustomerService) AddCustomerToGroup(ctx context.Context, customerID, groupID string) error {
	// Check if customer is already in group
	var count int64
	s.db.DB.WithContext(ctx).Model(&CustomerGroupCustomer{}).
		Where("customer_id = ? AND customer_group_id = ?", customerID, groupID).
		Count(&count)

	if count > 0 {
		return fmt.Errorf("customer is already in this group")
	}

	groupCustomer := CustomerGroupCustomer{
		CustomerID:     customerID,
		CustomerGroupID: groupID,
	}

	if err := s.db.DB.WithContext(ctx).Create(&groupCustomer).Error; err != nil {
		return fmt.Errorf("failed to add customer to group: %w", err)
	}

	return nil
}

func (s *CustomerService) RemoveCustomerFromGroup(ctx context.Context, customerID, groupID string) error {
	if err := s.db.DB.WithContext(ctx).
		Where("customer_id = ? AND customer_group_id = ?", customerID, groupID).
		Delete(&CustomerGroupCustomer{}).Error; err != nil {
		return fmt.Errorf("failed to remove customer from group: %w", err)
	}

	return nil
}

// ==================== LOYALTY PROGRAM OPERATIONS ====================

func (s *CustomerService) GetLoyaltyPrograms(ctx context.Context) ([]LoyaltyProgram, error) {
	cacheKey := "loyalty_programs"

	if cached, err := s.cache.Get(ctx, cacheKey); err == nil && cached != nil {
		if programs, ok := cached.([]LoyaltyProgram); ok {
			return programs, nil
		}
	}

	var programs []LoyaltyProgram
	if err := s.db.DB.WithContext(ctx).Where("is_active = ?", true).Order("tier ASC").Find(&programs).Error; err != nil {
		return nil, fmt.Errorf("failed to get loyalty programs: %w", err)
	}

	s.cache.Set(ctx, cacheKey, programs, 10*time.Minute)
	return programs, nil
}

func (s *CustomerService) CreateLoyaltyProgram(ctx context.Context, program *LoyaltyProgram) (*LoyaltyProgram, error) {
	if err := s.db.DB.WithContext(ctx).Create(program).Error; err != nil {
		return nil, fmt.Errorf("failed to create loyalty program: %w", err)
	}

	// Clear cache
	cacheKey := "loyalty_programs"
	s.cache.Delete(ctx, cacheKey)

	return program, nil
}

func (s *CustomerService) AddLoyaltyPoints(ctx context.Context, customerID string, points int, reason string) (*LoyaltyTransaction, error) {
	// Get current customer
	customer, err := s.GetCustomerByID(ctx, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, fmt.Errorf("customer not found")
	}

	// Create transaction
	transaction := LoyaltyTransaction{
		CustomerID:      customerID,
		Points:          points,
		TransactionType: "earned",
		Reason:          reason,
		BalanceAfter:    customer.LoyaltyPoints + points,
	}

	if err := s.db.DB.WithContext(ctx).Create(&transaction).Error; err != nil {
		return nil, fmt.Errorf("failed to create loyalty transaction: %w", err)
	}

	// Update customer points
	if err := s.db.DB.WithContext(ctx).Model(&Customer{}).
		Where("id = ?", customerID).
		Update("loyalty_points", gorm.Expr("loyalty_points + ?", points)).Error; err != nil {
		return nil, fmt.Errorf("failed to update customer loyalty points: %w", err)
	}

	// Check for tier upgrade
	if err := s.checkTierUpgrade(ctx, customerID); err != nil {
		return nil, err
	}

	// Clear cache
	cacheKey := "customers:*"
	s.cache.Delete(ctx, cacheKey)

	return &transaction, nil
}

func (s *CustomerService) RedeemLoyaltyPoints(ctx context.Context, customerID string, points int, reason string) (*LoyaltyTransaction, error) {
	// Get current customer
	customer, err := s.GetCustomerByID(ctx, customerID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, fmt.Errorf("customer not found")
	}

	if customer.LoyaltyPoints < points {
		return nil, fmt.Errorf("insufficient loyalty points")
	}

	// Create transaction
	transaction := LoyaltyTransaction{
		CustomerID:      customerID,
		Points:          -points, // Negative for redemption
		TransactionType: "redeemed",
		Reason:          reason,
		BalanceAfter:    customer.LoyaltyPoints - points,
	}

	if err := s.db.DB.WithContext(ctx).Create(&transaction).Error; err != nil {
		return nil, fmt.Errorf("failed to create loyalty transaction: %w", err)
	}

	// Update customer points
	if err := s.db.DB.WithContext(ctx).Model(&Customer{}).
		Where("id = ?", customerID).
		Update("loyalty_points", gorm.Expr("loyalty_points - ?", points)).Error; err != nil {
		return nil, fmt.Errorf("failed to update customer loyalty points: %w", err)
	}

	// Clear cache
	cacheKey := "customers:*"
	s.cache.Delete(ctx, cacheKey)

	return &transaction, nil
}

func (s *CustomerService) GetLoyaltyTransactions(ctx context.Context, customerID string, limit, offset int) ([]LoyaltyTransaction, int64, error) {
	var transactions []LoyaltyTransaction
	var total int64

	query := s.db.DB.WithContext(ctx).
		Model(&LoyaltyTransaction{}).
		Where("customer_id = ?", customerID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count loyalty transactions: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get loyalty transactions: %w", err)
	}

	return transactions, total, nil
}

func (s *CustomerService) checkTierUpgrade(ctx context.Context, customerID string) error {
	customer, err := s.GetCustomerByID(ctx, customerID)
	if err != nil {
		return err
	}

	// Get all loyalty programs ordered by tier
	var programs []LoyaltyProgram
	if err := s.db.DB.WithContext(ctx).
		Where("is_active = ?", true).
		Order("min_points ASC").
		Find(&programs).Error; err != nil {
		return fmt.Errorf("failed to get loyalty programs: %w", err)
	}

	var eligibleProgram *LoyaltyProgram
	for _, program := range programs {
		if customer.LoyaltyPoints >= program.MinPoints {
			eligibleProgram = &program
		} else {
			break
		}
	}

	if eligibleProgram != nil && customer.LoyaltyProgramID != eligibleProgram.ID {
		// Upgrade customer tier
		if err := s.db.DB.WithContext(ctx).Model(&Customer{}).
			Where("id = ?", customerID).
			Update("loyalty_program_id", eligibleProgram.ID).Error; err != nil {
			return fmt.Errorf("failed to upgrade customer tier: %w", err)
		}
	}

	return nil
}

// ==================== CUSTOMER INTERACTION OPERATIONS ====================

func (s *CustomerService) CreateCustomerInteraction(ctx context.Context, interaction *CustomerInteraction) (*CustomerInteraction, error) {
	if err := s.db.DB.WithContext(ctx).Create(interaction).Error; err != nil {
		return nil, fmt.Errorf("failed to create customer interaction: %w", err)
	}

	return interaction, nil
}

func (s *CustomerService) GetCustomerInteractions(ctx context.Context, customerID string, limit, offset int) ([]CustomerInteraction, int64, error) {
	var interactions []CustomerInteraction
	var total int64

	query := s.db.DB.WithContext(ctx).
		Model(&CustomerInteraction{}).
		Where("customer_id = ?", customerID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count customer interactions: %w", err)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&interactions).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get customer interactions: %w", err)
	}

	return interactions, total, nil
}

// ==================== CRM ANALYTICS ====================

func (s *CustomerService) GetCustomerAnalytics(ctx context.Context) (map[string]interface{}, error) {
	var totalCustomers, newCustomers, activeCustomers, churnedCustomers int64
	var avgLoyaltyPoints float64

	// Total customers
	s.db.DB.WithContext(ctx).Model(&Customer{}).Where("is_active = ?", true).Count(&totalCustomers)

	// New customers (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	s.db.DB.WithContext(ctx).Model(&Customer{}).
		Where("is_active = ? AND created_at >= ?", true, thirtyDaysAgo).
		Count(&newCustomers)

	// Active customers (customers with interactions in last 30 days)
	s.db.DB.WithContext(ctx).Model(&CustomerInteraction{}).
		Select("DISTINCT customer_id").
		Where("created_at >= ?", thirtyDaysAgo).
		Count(&activeCustomers)

	// Average loyalty points
	s.db.DB.WithContext(ctx).Model(&Customer{}).
		Where("is_active = ?", true).
		Select("COALESCE(AVG(loyalty_points), 0)").
		Scan(&avgLoyaltyPoints)

	// Top customer groups
	type GroupStats struct {
		GroupName string
		Count     int64
	}
	var groupStats []GroupStats

	s.db.DB.WithContext(ctx).Raw(`
		SELECT cg.name as group_name, COUNT(cgc.customer_id) as count
		FROM customer_groups cg
		LEFT JOIN customer_groups_customers cgc ON cg.id = cgc.customer_group_id
		LEFT JOIN customers c ON cgc.customer_id = c.id AND c.is_active = true
		WHERE cg.is_active = true
		GROUP BY cg.id, cg.name
		ORDER BY count DESC
		LIMIT 10
	`).Scan(&groupStats)

	return map[string]interface{}{
		"total_customers":      totalCustomers,
		"new_customers":        newCustomers,
		"active_customers":     activeCustomers,
		"churned_customers":    totalCustomers - activeCustomers,
		"avg_loyalty_points":   avgLoyaltyPoints,
		"top_customer_groups":  groupStats,
		"last_updated":         time.Now(),
	}, nil
}

func (s *CustomerService) GetCustomerLifetimeValue(ctx context.Context, customerID string) (float64, error) {
	var totalValue float64

	// Sum all completed orders for the customer
	s.db.DB.WithContext(ctx).Raw(`
		SELECT COALESCE(SUM(so.total_amount), 0)
		FROM sales_orders so
		WHERE so.customer_id = ? AND so.status = 'COMPLETED'
	`, customerID).Scan(&totalValue)

	return totalValue, nil
}

// ==================== CUSTOMER SEGMENTATION ====================

func (s *CustomerService) SegmentCustomers(ctx context.Context) (map[string][]Customer, error) {
	segments := make(map[string][]Customer)

	// High-value customers (loyalty points > 1000)
	var highValue []Customer
	s.db.DB.WithContext(ctx).
		Where("is_active = ? AND loyalty_points > ?", true, 1000).
		Order("loyalty_points DESC").
		Limit(100).
		Find(&highValue)
	segments["high_value"] = highValue

	// New customers (created in last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var newCustomers []Customer
	s.db.DB.WithContext(ctx).
		Where("is_active = ? AND created_at >= ?", true, thirtyDaysAgo).
		Order("created_at DESC").
		Find(&newCustomers)
	segments["new"] = newCustomers

	// At-risk customers (no interactions in last 90 days)
	ninetyDaysAgo := time.Now().AddDate(0, 0, -90)
	var atRisk []Customer
	s.db.DB.WithContext(ctx).Raw(`
		SELECT c.* FROM customers c
		WHERE c.is_active = true
		AND c.id NOT IN (
			SELECT DISTINCT ci.customer_id
			FROM customer_interactions ci
			WHERE ci.created_at >= ?
		)
		AND c.id NOT IN (
			SELECT DISTINCT so.customer_id
			FROM sales_orders so
			WHERE so.created_at >= ?
		)
		ORDER BY c.created_at DESC
		LIMIT 100
	`, ninetyDaysAgo, ninetyDaysAgo).Scan(&atRisk)
	segments["at_risk"] = atRisk

	return segments, nil
}

// ==================== CUSTOMER HANDLERS ====================

type CustomerHandler struct {
	customerService *CustomerService
	db              *Database
	cache           *CacheService
	config          Config
}

func NewCustomerHandler(customerService *CustomerService, db *Database, cache *CacheService, config Config) *CustomerHandler {
	return &CustomerHandler{
		customerService: customerService,
		db:              db,
		cache:           cache,
		config:          config,
	}
}

// Customer endpoints
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	ctx := c.Request.Context()

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	search := c.Query("search")
	groupID := c.Query("group_id")
	loyaltyTier := c.Query("loyalty_tier")
	city := c.Query("city")
	state := c.Query("state")
	minPointsStr := c.Query("min_points")
	maxPointsStr := c.Query("max_points")

	filters := make(map[string]interface{})
	if search != "" {
		filters["search"] = search
	}
	if groupID != "" {
		filters["group_id"] = groupID
	}
	if loyaltyTier != "" {
		filters["loyalty_tier"] = loyaltyTier
	}
	if city != "" {
		filters["city"] = city
	}
	if state != "" {
		filters["state"] = state
	}
	if minPointsStr != "" {
		if minPoints, err := strconv.Atoi(minPointsStr); err == nil {
			filters["min_points"] = minPoints
		}
	}
	if maxPointsStr != "" {
		if maxPoints, err := strconv.Atoi(maxPointsStr); err == nil {
			filters["max_points"] = maxPoints
		}
	}

	customers, total, err := h.customerService.GetCustomers(ctx, filters, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(customers),
		},
	})
}

func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	customer, err := h.customerService.GetCustomerByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if customer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, customer)
}

func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	ctx := c.Request.Context()
	var customer Customer

	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdCustomer, err := h.customerService.CreateCustomer(ctx, &customer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdCustomer)
}

func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedCustomer, err := h.customerService.UpdateCustomer(ctx, id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if updatedCustomer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, updatedCustomer)
}

func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	if err := h.customerService.DeleteCustomer(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// Customer Group endpoints
func (h *CustomerHandler) GetCustomerGroups(c *gin.Context) {
	ctx := c.Request.Context()

	groups, err := h.customerService.GetCustomerGroups(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customer_groups": groups,
		"count":           len(groups),
	})
}

func (h *CustomerHandler) CreateCustomerGroup(c *gin.Context) {
	ctx := c.Request.Context()
	var group CustomerGroup

	if err := c.ShouldBindJSON(&group); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdGroup, err := h.customerService.CreateCustomerGroup(ctx, &group)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdGroup)
}

func (h *CustomerHandler) AddCustomerToGroup(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")
	groupID := c.Param("group_id")

	if err := h.customerService.AddCustomerToGroup(ctx, customerID, groupID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer added to group successfully"})
}

func (h *CustomerHandler) RemoveCustomerFromGroup(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")
	groupID := c.Param("group_id")

	if err := h.customerService.RemoveCustomerFromGroup(ctx, customerID, groupID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer removed from group successfully"})
}

// Loyalty endpoints
func (h *CustomerHandler) GetLoyaltyPrograms(c *gin.Context) {
	ctx := c.Request.Context()

	programs, err := h.customerService.GetLoyaltyPrograms(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"loyalty_programs": programs,
		"count":            len(programs),
	})
}

func (h *CustomerHandler) CreateLoyaltyProgram(c *gin.Context) {
	ctx := c.Request.Context()
	var program LoyaltyProgram

	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdProgram, err := h.customerService.CreateLoyaltyProgram(ctx, &program)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdProgram)
}

func (h *CustomerHandler) AddLoyaltyPoints(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")

	var req struct {
		Points int    `json:"points" binding:"required"`
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.customerService.AddLoyaltyPoints(ctx, customerID, req.Points, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *CustomerHandler) RedeemLoyaltyPoints(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")

	var req struct {
		Points int    `json:"points" binding:"required"`
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	transaction, err := h.customerService.RedeemLoyaltyPoints(ctx, customerID, req.Points, req.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

func (h *CustomerHandler) GetLoyaltyTransactions(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	transactions, total, err := h.customerService.GetLoyaltyTransactions(ctx, customerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(transactions),
		},
	})
}

// Interaction endpoints
func (h *CustomerHandler) CreateInteraction(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")

	var interaction CustomerInteraction
	if err := c.ShouldBindJSON(&interaction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	interaction.CustomerID = customerID

	createdInteraction, err := h.customerService.CreateCustomerInteraction(ctx, &interaction)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdInteraction)
}

func (h *CustomerHandler) GetCustomerInteractions(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	interactions, total, err := h.customerService.GetCustomerInteractions(ctx, customerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"interactions": interactions,
		"pagination": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(interactions),
		},
	})
}

// Analytics endpoints
func (h *CustomerHandler) GetCustomerAnalytics(c *gin.Context) {
	ctx := c.Request.Context()

	analytics, err := h.customerService.GetCustomerAnalytics(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

func (h *CustomerHandler) GetCustomerLifetimeValue(c *gin.Context) {
	ctx := c.Request.Context()
	customerID := c.Param("customer_id")

	value, err := h.customerService.GetCustomerLifetimeValue(ctx, customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customer_id":     customerID,
		"lifetime_value":  value,
	})
}

func (h *CustomerHandler) SegmentCustomers(c *gin.Context) {
	ctx := c.Request.Context()

	segments, err := h.customerService.SegmentCustomers(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, segments)
}
