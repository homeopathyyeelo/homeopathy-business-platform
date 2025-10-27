// Customer Loyalty System Handlers - Points, rewards, and gift cards
package main

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LoyaltyHandler handles customer loyalty operations
type LoyaltyHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewLoyaltyHandler creates a new loyalty handler
func NewLoyaltyHandler(db *GORMDatabase, cache *CacheService) *LoyaltyHandler {
	return &LoyaltyHandler{db: db, cache: cache}
}

// ==================== LOYALTY PROGRAM MANAGEMENT ====================

// GetLoyaltyPrograms retrieves all loyalty programs
func (h *LoyaltyHandler) GetLoyaltyPrograms(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var programs []LoyaltyProgram
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&LoyaltyProgram{}).Where("is_active = ?", true)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count loyalty programs"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve loyalty programs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"programs": programs,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetLoyaltyProgram retrieves a specific loyalty program
func (h *LoyaltyHandler) GetLoyaltyProgram(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var program LoyaltyProgram

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&program).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Loyalty program not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve loyalty program"})
		return
	}

	c.JSON(http.StatusOK, program)
}

// CreateLoyaltyProgram creates a new loyalty program
func (h *LoyaltyHandler) CreateLoyaltyProgram(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var program LoyaltyProgram
	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	program.IsActive = true
	program.StartDate = time.Now()

	if err := h.db.DB.WithContext(ctx).Create(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create loyalty program"})
		return
	}

	c.JSON(http.StatusCreated, program)
}

// UpdateLoyaltyProgram updates an existing loyalty program
func (h *LoyaltyHandler) UpdateLoyaltyProgram(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var program LoyaltyProgram

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&program).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Loyalty program not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve loyalty program"})
		return
	}

	var updateData LoyaltyProgram
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	program.Name = updateData.Name
	program.Description = updateData.Description
	program.PointsPerRupee = updateData.PointsPerRupee
	program.MinPointsForRedemption = updateData.MinPointsForRedemption
	program.ExpiryDays = updateData.ExpiryDays

	if err := h.db.DB.WithContext(ctx).Save(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update loyalty program"})
		return
	}

	c.JSON(http.StatusOK, program)
}

// ==================== CUSTOMER LOYALTY POINTS ====================

// GetCustomerLoyalty retrieves customer loyalty information
func (h *LoyaltyHandler) GetCustomerLoyalty(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	customerID := c.Param("customer_id")

	// Get customer loyalty summary
	var summary map[string]interface{}

	query := `
		SELECT
			c.id as customer_id,
			c.name as customer_name,
			c.phone as customer_phone,
			COALESCE(SUM(lt.points_earned), 0) as total_points_earned,
			COALESCE(SUM(lt.points_redeemed), 0) as total_points_redeemed,
			COALESCE(SUM(lt.points_earned) - SUM(lt.points_redeemed), 0) as current_balance,
			COUNT(CASE WHEN lt.transaction_type = 'earn' THEN 1 END) as earn_transactions,
			COUNT(CASE WHEN lt.transaction_type = 'redeem' THEN 1 END) as redeem_transactions,
			MAX(lt.created_at) as last_activity
		FROM customers c
		LEFT JOIN loyalty_transactions lt ON c.id = lt.customer_id
		WHERE c.id = ?
		GROUP BY c.id, c.name, c.phone
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, customerID).Scan(&summary).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve customer loyalty"})
		return
	}

	// Get recent transactions
	var transactions []LoyaltyTransaction
	h.db.DB.WithContext(ctx).Where("customer_id = ?", customerID).Order("created_at DESC").Limit(10).Find(&transactions)

	response := map[string]interface{}{
		"customer_summary": summary,
		"recent_transactions": transactions,
	}

	c.JSON(http.StatusOK, response)
}

// EarnLoyaltyPoints awards points to a customer
func (h *LoyaltyHandler) EarnLoyaltyPoints(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		CustomerID   string  `json:"customer_id" binding:"required"`
		InvoiceID    string  `json:"invoice_id" binding:"required"`
		Amount       float64 `json:"amount" binding:"required,min=0"`
		PointsToEarn float64 `json:"points_to_earn"`
		Description  string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get active loyalty program
	var program LoyaltyProgram
	if err := h.db.DB.WithContext(ctx).Where("is_active = ?", true).First(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No active loyalty program found"})
		return
	}

	// Calculate points if not provided
	if request.PointsToEarn == 0 {
		request.PointsToEarn = math.Floor(request.Amount * program.PointsPerRupee)
	}

	// Create loyalty transaction
	transaction := LoyaltyTransaction{
		CustomerID:     request.CustomerID,
		InvoiceID:      request.InvoiceID,
		TransactionType: "earn",
		PointsEarned:   request.PointsToEarn,
		PointsRedeemed: 0,
		Description:    request.Description,
		ExpiryDate:     time.Now().AddDate(0, 0, program.ExpiryDays),
	}

	if err := h.db.DB.WithContext(ctx).Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to earn loyalty points"})
		return
	}

	response := map[string]interface{}{
		"message":      "Points earned successfully",
		"points_earned": request.PointsToEarn,
		"transaction_id": transaction.ID,
		"expiry_date":   transaction.ExpiryDate,
	}

	c.JSON(http.StatusOK, response)
}

// RedeemLoyaltyPoints redeems customer loyalty points
func (h *LoyaltyHandler) RedeemLoyaltyPoints(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		CustomerID    string  `json:"customer_id" binding:"required"`
		PointsToRedeem float64 `json:"points_to_redeem" binding:"required,min=1"`
		RewardID      string  `json:"reward_id"`
		Description   string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check customer's current points balance
	var balance float64
	query := `
		SELECT COALESCE(SUM(points_earned) - SUM(points_redeemed), 0)
		FROM loyalty_transactions
		WHERE customer_id = ? AND expiry_date > NOW()
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, request.CustomerID).Scan(&balance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check points balance"})
		return
	}

	if balance < request.PointsToRedeem {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient points balance"})
		return
	}

	// Create redemption transaction
	transaction := LoyaltyTransaction{
		CustomerID:     request.CustomerID,
		RewardID:       request.RewardID,
		TransactionType: "redeem",
		PointsEarned:   0,
		PointsRedeemed: request.PointsToRedeem,
		Description:    request.Description,
		ExpiryDate:     time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to redeem loyalty points"})
		return
	}

	response := map[string]interface{}{
		"message":         "Points redeemed successfully",
		"points_redeemed": request.PointsToRedeem,
		"remaining_balance": balance - request.PointsToRedeem,
		"transaction_id":  transaction.ID,
	}

	c.JSON(http.StatusOK, response)
}

// GetLoyaltyTransactions retrieves customer loyalty transactions
func (h *LoyaltyHandler) GetLoyaltyTransactions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	customerID := c.Param("customer_id")
	var transactions []LoyaltyTransaction
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&LoyaltyTransaction{}).Where("customer_id = ?", customerID)

	// Apply filters
	if transactionType := c.Query("type"); transactionType != "" {
		query = query.Where("transaction_type = ?", transactionType)
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count transactions"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve transactions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"total":        total,
		"limit":        limit,
		"offset":       offset,
	})
}

// ==================== REWARDS MANAGEMENT ====================

// GetRewards retrieves available rewards
func (h *LoyaltyHandler) GetRewards(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var rewards []Reward
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&Reward{}).Where("is_active = ?", true)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count rewards"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("points_required").Find(&rewards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve rewards"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rewards": rewards,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetReward retrieves a specific reward
func (h *LoyaltyHandler) GetReward(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var reward Reward

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&reward).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve reward"})
		return
	}

	c.JSON(http.StatusOK, reward)
}

// CreateReward creates a new reward
func (h *LoyaltyHandler) CreateReward(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var reward Reward
	if err := c.ShouldBindJSON(&reward); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	reward.IsActive = true

	if err := h.db.DB.WithContext(ctx).Create(&reward).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reward"})
		return
	}

	c.JSON(http.StatusCreated, reward)
}

// UpdateReward updates an existing reward
func (h *LoyaltyHandler) UpdateReward(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var reward Reward

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&reward).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Reward not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve reward"})
		return
	}

	var updateData Reward
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	reward.Name = updateData.Name
	reward.Description = updateData.Description
	reward.PointsRequired = updateData.PointsRequired
	reward.RewardType = updateData.RewardType
	reward.RewardValue = updateData.RewardValue

	if err := h.db.DB.WithContext(ctx).Save(&reward).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update reward"})
		return
	}

	c.JSON(http.StatusOK, reward)
}

// ==================== GIFT CARDS ====================

// GetGiftCards retrieves customer gift cards
func (h *LoyaltyHandler) GetGiftCards(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	customerID := c.Param("customer_id")
	var giftCards []GiftCard
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&GiftCard{}).Where("customer_id = ? AND status = ?", customerID, "active")

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count gift cards"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&giftCards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve gift cards"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"gift_cards": giftCards,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// IssueGiftCard issues a new gift card
func (h *LoyaltyHandler) IssueGiftCard(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		CustomerID   string    `json:"customer_id" binding:"required"`
		Amount       float64   `json:"amount" binding:"required,min=1"`
		ExpiryDate   time.Time `json:"expiry_date" binding:"required"`
		Description  string    `json:"description"`
		IssuedBy     string    `json:"issued_by"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate gift card code
	giftCardCode := generateGiftCardCode()

	giftCard := GiftCard{
		Code:        giftCardCode,
		CustomerID:  request.CustomerID,
		Amount:      request.Amount,
		Balance:     request.Amount,
		Status:      "active",
		ExpiryDate:  request.ExpiryDate,
		Description: request.Description,
		IssuedBy:    request.IssuedBy,
		IssuedAt:    time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&giftCard).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue gift card"})
		return
	}

	response := map[string]interface{}{
		"message":       "Gift card issued successfully",
		"gift_card_code": giftCard.Code,
		"amount":        giftCard.Amount,
		"balance":       giftCard.Balance,
		"expiry_date":   giftCard.ExpiryDate,
		"gift_card_id":  giftCard.ID,
	}

	c.JSON(http.StatusCreated, response)
}

// RedeemGiftCard redeems a gift card
func (h *LoyaltyHandler) RedeemGiftCard(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		GiftCardCode string  `json:"gift_card_code" binding:"required"`
		Amount       float64 `json:"amount" binding:"required,min=0.01"`
		Description  string  `json:"description"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find and validate gift card
	var giftCard GiftCard
	if err := h.db.DB.WithContext(ctx).Where("code = ? AND status = ?", request.GiftCardCode, "active").First(&giftCard).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gift card not found or expired"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve gift card"})
		return
	}

	// Check expiry
	if time.Now().After(giftCard.ExpiryDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gift card has expired"})
		return
	}

	// Check balance
	if giftCard.Balance < request.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient gift card balance"})
		return
	}

	// Update gift card balance
	newBalance := giftCard.Balance - request.Amount
	status := "active"
	if newBalance <= 0 {
		status = "redeemed"
	}

	updates := map[string]interface{}{
		"balance": newBalance,
		"status":  status,
		"redeemed_at": time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Model(&giftCard).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to redeem gift card"})
		return
	}

	// Log redemption
	redemption := GiftCardRedemption{
		GiftCardID:  giftCard.ID,
		Amount:      request.Amount,
		Balance:     newBalance,
		Description: request.Description,
		RedeemedAt:  time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Create(&redemption).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log redemption"})
		return
	}

	response := map[string]interface{}{
		"message":         "Gift card redeemed successfully",
		"redeemed_amount": request.Amount,
		"remaining_balance": newBalance,
		"gift_card_code":  giftCard.Code,
		"status":          status,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== LOYALTY ANALYTICS ====================

// GetLoyaltyAnalytics retrieves loyalty program analytics
func (h *LoyaltyHandler) GetLoyaltyAnalytics(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Date range filter
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	var analytics map[string]interface{}

	query := `
		SELECT
			COUNT(DISTINCT lt.customer_id) as active_customers,
			COUNT(lt.id) as total_transactions,
			COALESCE(SUM(lt.points_earned), 0) as total_points_earned,
			COALESCE(SUM(lt.points_redeemed), 0) as total_points_redeemed,
			COUNT(CASE WHEN lt.transaction_type = 'earn' THEN 1 END) as earn_transactions,
			COUNT(CASE WHEN lt.transaction_type = 'redeem' THEN 1 END) as redeem_transactions,
			AVG(lt.points_earned) as avg_points_per_transaction
		FROM loyalty_transactions lt
		WHERE lt.created_at BETWEEN ? AND ?
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, startDate, endDate).Scan(&analytics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve loyalty analytics"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"analytics":  analytics,
	}

	c.JSON(http.StatusOK, response)
}

// ==================== UTILITY FUNCTIONS ====================

func generateGiftCardCode() string {
	// Generate a unique gift card code
	return fmt.Sprintf("GC%08d", time.Now().UnixNano()%100000000)
}
