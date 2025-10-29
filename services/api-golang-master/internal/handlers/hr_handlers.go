// HR Handlers - Complete implementation for user management, roles, permissions, and employee management
package main

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// HRHandler handles all HR and employee management operations
type HRHandler struct {
	db    *GORMDatabase
	cache *CacheService
}

// NewHRHandler creates a new HR handler
func NewHRHandler(db *GORMDatabase, cache *CacheService) *HRHandler {
	return &HRHandler{db: db, cache: cache}
}

// ==================== USER MANAGEMENT HANDLERS ====================

// GetUsers retrieves all users
func (h *HRHandler) GetUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var users []User
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&User{}).Where("is_active = ?", true)

	// Apply filters
	if department := c.Query("department"); department != "" {
		query = query.Where("department = ?", department)
	}
	if designation := c.Query("designation"); designation != "" {
		query = query.Where("designation = ?", designation)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

// GetUser retrieves a specific user
func (h *HRHandler) GetUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var user User

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser creates a new user
func (h *HRHandler) CreateUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	user.PasswordHash = string(hashedPassword)

	// Set default values
	user.IsActive = true
	user.LastLogin = nil

	if err := h.db.DB.WithContext(ctx).Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "users:*")

	c.JSON(http.StatusCreated, user)
}

// UpdateUser updates an existing user
func (h *HRHandler) UpdateUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var user User

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	var updateData User
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields (excluding password for security)
	user.FirstName = updateData.FirstName
	user.LastName = updateData.LastName
	user.Phone = updateData.Phone
	user.Department = updateData.Department
	user.Designation = updateData.Designation
	user.DateOfJoining = updateData.DateOfJoining
	user.Salary = updateData.Salary

	// Update password only if provided
	if updateData.PasswordHash != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(updateData.PasswordHash), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.PasswordHash = string(hashedPassword)
	}

	if err := h.db.DB.WithContext(ctx).Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "users:*")

	c.JSON(http.StatusOK, user)
}

// DeleteUser soft deletes a user
func (h *HRHandler) DeleteUser(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&User{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "users:*")

	c.JSON(http.StatusNoContent, nil)
}

// UpdateUserStatus activates or deactivates a user
func (h *HRHandler) UpdateUserStatus(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var request struct {
		IsActive bool `json:"is_active" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"is_active":  request.IsActive,
		"updated_at": time.Now(),
	}

	if err := h.db.DB.WithContext(ctx).Model(&User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
		return
	}

	// Clear cache
	h.cache.DeletePattern(ctx, "users:*")

	c.JSON(http.StatusOK, gin.H{"message": "User status updated successfully"})
}

// ==================== ROLE MANAGEMENT HANDLERS ====================

// GetRoles retrieves all roles
func (h *HRHandler) GetRoles(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var roles []Role
	var total int64

	query := h.db.DB.WithContext(ctx).Model(&Role{}).Where("is_active = ?", true)

	// Pagination
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count roles"})
		return
	}

	if err := query.Limit(limit).Offset(offset).Order("name").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve roles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"roles": roles,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

// GetRole retrieves a specific role
func (h *HRHandler) GetRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var role Role

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve role"})
		return
	}

	c.JSON(http.StatusOK, role)
}

// CreateRole creates a new role
func (h *HRHandler) CreateRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var role Role
	if err := c.ShouldBindJSON(&role); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values
	role.IsActive = true

	if err := h.db.DB.WithContext(ctx).Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create role"})
		return
	}

	c.JSON(http.StatusCreated, role)
}

// UpdateRole updates an existing role
func (h *HRHandler) UpdateRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")
	var role Role

	if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", id, true).First(&role).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve role"})
		return
	}

	var updateData Role
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	role.Name = updateData.Name
	role.Description = updateData.Description
	role.Permissions = updateData.Permissions

	if err := h.db.DB.WithContext(ctx).Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, role)
}

// DeleteRole soft deletes a role
func (h *HRHandler) DeleteRole(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	id := c.Param("id")

	if err := h.db.DB.WithContext(ctx).Model(&Role{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetPermissions retrieves available permissions
func (h *HRHandler) GetPermissions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	// Define comprehensive permission list
	permissions := []map[string]interface{}{
		{"id": "read", "name": "Read", "description": "View data and reports"},
		{"id": "write", "name": "Write", "description": "Create and modify data"},
		{"id": "delete", "name": "Delete", "description": "Delete records"},
		{"id": "manage_users", "name": "Manage Users", "description": "Create, edit, and delete users"},
		{"id": "manage_roles", "name": "Manage Roles", "description": "Create and modify roles and permissions"},
		{"id": "view_reports", "name": "View Reports", "description": "Access all reports and analytics"},
		{"id": "manage_inventory", "name": "Manage Inventory", "description": "Full inventory management"},
		{"id": "manage_sales", "name": "Manage Sales", "description": "Full sales management"},
		{"id": "manage_purchases", "name": "Manage Purchases", "description": "Full purchase management"},
		{"id": "manage_finance", "name": "Manage Finance", "description": "Full financial management"},
		{"id": "manage_marketing", "name": "Manage Marketing", "description": "Full marketing management"},
		{"id": "system_admin", "name": "System Admin", "description": "Full system administration"},
	}

	c.JSON(http.StatusOK, permissions)
}

// ==================== EMPLOYEE MANAGEMENT HANDLERS ====================

// GetEmployees retrieves all employees (alias for users with employee data)
func (h *HRHandler) GetEmployees(c *gin.Context) {
	// Redirect to users endpoint for now
	h.GetUsers(c)
}

// GetEmployee retrieves a specific employee
func (h *HRHandler) GetEmployee(c *gin.Context) {
	// Redirect to user endpoint for now
	h.GetUser(c)
}

// CreateEmployee creates a new employee
func (h *HRHandler) CreateEmployee(c *gin.Context) {
	// Redirect to user creation for now
	h.CreateUser(c)
}

// UpdateEmployee updates an existing employee
func (h *HRHandler) UpdateEmployee(c *gin.Context) {
	// Redirect to user update for now
	h.UpdateUser(c)
}

// ==================== ATTENDANCE HANDLERS ====================

// GetAttendance retrieves attendance records
func (h *HRHandler) GetAttendance(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Query("user_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		// Default to current month
		now := time.Now()
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	query := `
		SELECT
			u.id,
			u.first_name || ' ' || u.last_name as employee_name,
			u.employee_code,
			u.department,
			COUNT(a.id) as present_days,
			COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
			COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
			AVG(EXTRACT(HOURS FROM (a.check_out_time - a.check_in_time))) as avg_hours_per_day
		FROM users u
		LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date BETWEEN ? AND ?
		WHERE u.is_active = true
	`

	params := []interface{}{startDate, endDate}

	if userID != "" {
		query += " AND u.id = ?"
		params = append(params, userID)
	}

	query += " GROUP BY u.id, u.first_name, u.last_name, u.employee_code, u.department"
	query += " ORDER BY u.first_name, u.last_name"

	var attendance []map[string]interface{}

	if err := h.db.DB.WithContext(ctx).Raw(query, params...).Scan(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve attendance"})
		return
	}

	response := map[string]interface{}{
		"start_date": startDate,
		"end_date":   endDate,
		"attendance": attendance,
		"total_employees": len(attendance),
	}

	c.JSON(http.StatusOK, response)
}

// MarkAttendance marks attendance for an employee
func (h *HRHandler) MarkAttendance(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	var request struct {
		UserID       string    `json:"user_id" binding:"required"`
		AttendanceDate time.Time `json:"attendance_date" binding:"required"`
		CheckInTime  time.Time `json:"check_in_time" binding:"required"`
		CheckOutTime *time.Time `json:"check_out_time"`
		Status       string    `json:"status" binding:"required"`
		Notes        string    `json:"notes"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"present", "absent", "late", "half_day"}
	isValid := false
	for _, status := range validStatuses {
		if request.Status == status {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attendance status"})
		return
	}

	// Create attendance record
	attendance := Attendance{
		UserID:         request.UserID,
		AttendanceDate: request.AttendanceDate,
		CheckInTime:    request.CheckInTime,
		CheckOutTime:   request.CheckOutTime,
		Status:         request.Status,
		Notes:          request.Notes,
	}

	if err := h.db.DB.WithContext(ctx).Create(&attendance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark attendance"})
		return
	}

	c.JSON(http.StatusCreated, attendance)
}

// ==================== PAYROLL HANDLERS ====================

// GetSalaryRecords retrieves salary records
func (h *HRHandler) GetSalaryRecords(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	userID := c.Query("user_id")
	year := c.Query("year")
	month := c.Query("month")

	if year == "" {
		year = fmt.Sprintf("%d", time.Now().Year())
	}
	if month == "" {
		month = fmt.Sprintf("%d", int(time.Now().Month()))
	}

	query := `
		SELECT
			s.id,
			u.first_name || ' ' || u.last_name as employee_name,
			u.employee_code,
			u.department,
			s.salary_month,
			s.salary_year,
			s.basic_salary,
			s.allowances,
			s.deductions,
			s.net_salary,
			s.payment_date,
			s.payment_status,
			s.payment_reference
		FROM salary_records s
		JOIN users u ON s.user_id = u.id
		WHERE s.salary_year = ? AND s.salary_month = ?
	`

	params := []interface{}{year, month}

	if userID != "" {
		query += " AND s.user_id = ?"
		params = append(params, userID)
	}

	query += " ORDER BY u.first_name, u.last_name"

	var salaries []map[string]interface{}

	if err := h.db.DB.WithContext(ctx).Raw(query, params...).Scan(&salaries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve salary records"})
		return
	}

	response := map[string]interface{}{
		"year":     year,
		"month":    month,
		"salaries": salaries,
		"total_employees": len(salaries),
	}

	c.JSON(http.StatusOK, response)
}

// ProcessSalary processes salary for employees
func (h *HRHandler) ProcessSalary(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second) // Longer timeout for batch processing
	defer cancel()

	var request struct {
		UserIDs    []string `json:"user_ids" binding:"required"`
		SalaryMonth int     `json:"salary_month" binding:"required"`
		SalaryYear  int     `json:"salary_year" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, this would:
	// 1. Calculate salary based on attendance, deductions, allowances
	// 2. Generate salary slips
	// 3. Update employee salary records
	// 4. Create journal entries for payroll

	successCount := 0
	for _, userID := range request.UserIDs {
		// Get employee details
		var user User
		if err := h.db.DB.WithContext(ctx).Where("id = ? AND is_active = ?", userID, true).First(&user).Error; err != nil {
			continue
		}

		// Calculate salary (simplified calculation)
		basicSalary := user.Salary
		allowances := basicSalary * 0.2 // 20% allowances
		deductions := basicSalary * 0.1 // 10% deductions
		netSalary := basicSalary + allowances - deductions

		// Create salary record
		salaryRecord := SalaryRecord{
			UserID:        userID,
			SalaryMonth:   request.SalaryMonth,
			SalaryYear:    request.SalaryYear,
			BasicSalary:   basicSalary,
			Allowances:    allowances,
			Deductions:    deductions,
			NetSalary:     netSalary,
			PaymentStatus: "pending",
		}

		if err := h.db.DB.WithContext(ctx).Create(&salaryRecord).Error; err == nil {
			successCount++
		}
	}

	response := map[string]interface{}{
		"message":           "Salary processing completed",
		"total_employees":   len(request.UserIDs),
		"successful_processes": successCount,
		"failed_processes":  len(request.UserIDs) - successCount,
		"salary_month":      request.SalaryMonth,
		"salary_year":       request.SalaryYear,
		"processed_at":      time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetPayrollReports retrieves payroll reports
func (h *HRHandler) GetPayrollReports(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	year := c.Query("year")
	if year == "" {
		year = fmt.Sprintf("%d", time.Now().Year())
	}

	yearInt, _ := strconv.Atoi(year)

	var report map[string]interface{}

	query := `
		SELECT
			COUNT(DISTINCT s.user_id) as total_employees,
			COUNT(s.id) as total_salary_records,
			COALESCE(SUM(s.net_salary), 0) as total_payroll_cost,
			COUNT(CASE WHEN s.payment_status = 'paid' THEN 1 END) as paid_salaries,
			COUNT(CASE WHEN s.payment_status = 'pending' THEN 1 END) as pending_salaries
		FROM salary_records s
		WHERE s.salary_year = ?
	`

	if err := h.db.DB.WithContext(ctx).Raw(query, yearInt).Scan(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate payroll report"})
		return
	}

	// Get monthly breakdown
	monthlyQuery := `
		SELECT
			s.salary_month,
			COUNT(s.id) as records_count,
			COALESCE(SUM(s.net_salary), 0) as monthly_cost
		FROM salary_records s
		WHERE s.salary_year = ?
		GROUP BY s.salary_month
		ORDER BY s.salary_month
	`

	var monthlyData []map[string]interface{}
	h.db.DB.WithContext(ctx).Raw(monthlyQuery, yearInt).Scan(&monthlyData)

	report["year"] = year
	report["monthly_breakdown"] = monthlyData

	c.JSON(http.StatusOK, report)
}
