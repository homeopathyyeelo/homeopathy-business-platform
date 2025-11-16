package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userService: services.NewUserService(),
	}
}

// ListUsers returns paginated list of users
func (h *UserHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	users, total, err := h.userService.ListUsers(page, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetUser returns a single user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userService.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// CreateUser creates a new user
func (h *UserHandler) CreateUser(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// UpdateUser updates an existing user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.userService.UpdateUser(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

// DeleteUser deletes a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.userService.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// ActivateUser activates a user account
func (h *UserHandler) ActivateUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.userService.ActivateUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User activated successfully"})
}

// DeactivateUser deactivates a user account
func (h *UserHandler) DeactivateUser(c *gin.Context) {
	id := c.Param("id")
	if err := h.userService.DeactivateUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated successfully"})
}

// GetUsers is an alias for ListUsers
func (h *UserHandler) GetUsers(c *gin.Context) {
	h.ListUsers(c)
}

// GetMe returns the currently authenticated user's information
func (h *UserHandler) GetMe(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "User not authenticated - no user_id in context",
		})
		return
	}

	// Debug: Log the actual userID value and type
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid user ID type in context",
			"debug":   map[string]interface{}{"userID": userID, "type": fmt.Sprintf("%T", userID)},
		})
		return
	}

	// Handle super admin case
	if userIDStr == "superadmin-1" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"user": gin.H{
				"id":            "superadmin-1",
				"email":         "medicine@yeelohomeopathy.com",
				"name":          "Super Admin",
				"displayName":   "Super Admin",
				"firstName":     "Super",
				"lastName":      "Admin",
				"role":          "SUPER_ADMIN",
				"isActive":      true,
				"isSuperAdmin":  true,
				"permissions":   []string{},
			},
		})
		return
	}

	// Get regular user from database
	user, err := h.userService.GetUserByID(userIDStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "User not found in database",
			"debug":   map[string]interface{}{"userID": userIDStr, "dbError": err.Error()},
		})
		return
	}

	// Get user email and role from context
	userEmail, _ := c.Get("user_email")
	userRole, _ := c.Get("user_role")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": gin.H{
			"id":           user.ID,
			"email":        userEmail,
			"name":         user.DisplayName,
			"displayName":  user.DisplayName,
			"firstName":    user.FirstName,
			"lastName":     user.LastName,
			"role":         userRole,
			"isActive":     user.IsActive,
			"isSuperAdmin": false,
			"permissions":  []string{},
		},
	})
}

// GetRoles returns all roles
func (h *UserHandler) GetRoles(c *gin.Context) {
	roles := []gin.H{
		{"id": "1", "name": "Admin", "description": "Full system access"},
		{"id": "2", "name": "Manager", "description": "Management access"},
		{"id": "3", "name": "Staff", "description": "Limited access"},
		{"id": "4", "name": "Cashier", "description": "POS access only"},
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    roles,
	})
}

// CreateRole creates a new role
func (h *UserHandler) CreateRole(c *gin.Context) {
	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := gin.H{
		"id":          "role-" + uuid.New().String()[:8],
		"name":        req["name"],
		"description": req["description"],
		"created_at":  time.Now(),
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    role,
		"message": "Role created successfully",
	})
}

// GetPermissions returns all available permissions
func (h *UserHandler) GetPermissions(c *gin.Context) {
	permissions := []gin.H{
		{"id": "1", "module": "products", "action": "create", "description": "Create products"},
		{"id": "2", "module": "products", "action": "read", "description": "View products"},
		{"id": "3", "module": "products", "action": "update", "description": "Update products"},
		{"id": "4", "module": "products", "action": "delete", "description": "Delete products"},
		{"id": "5", "module": "sales", "action": "create", "description": "Create sales"},
		{"id": "6", "module": "sales", "action": "read", "description": "View sales"},
		{"id": "7", "module": "inventory", "action": "adjust", "description": "Adjust inventory"},
		{"id": "8", "module": "reports", "action": "view", "description": "View reports"},
		{"id": "9", "module": "settings", "action": "manage", "description": "Manage settings"},
		{"id": "10", "module": "users", "action": "manage", "description": "Manage users"},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    permissions,
	})
}
