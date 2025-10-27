package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type CategoryHandler struct {
	categoryService *services.CategoryService
	db              *gorm.DB
}

func NewCategoryHandler(db *gorm.DB) *CategoryHandler {
	return &CategoryHandler{
		categoryService: services.NewCategoryService(db),
		db:              db,
	}
}

// GetCategories handles GET /api/erp/categories
func (h *CategoryHandler) GetCategories(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	search := c.Query("search")
	parentID := c.Query("parent_id")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	// Convert parentID to pointer if provided
	var parentIDPtr *string
	if parentID != "" {
		parentIDPtr = &parentID
	}

	categories, total, err := h.categoryService.GetAllCategories(limit, offset, search, parentIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"categories": categories,
			"pagination": gin.H{
				"total":  total,
				"limit":  limit,
				"offset": offset,
				"count":  len(categories),
			},
		},
	})
}

// GetCategory handles GET /api/erp/categories/:id
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	id := c.Param("id")

	category, err := h.categoryService.GetCategoryByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if category == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Category not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    category,
	})
}

// CreateCategory handles POST /api/erp/categories
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var category models.Category

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	createdCategory, err := h.categoryService.CreateCategory(&category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    createdCategory,
		"message": "Category created successfully",
	})
}

// UpdateCategory handles PUT /api/erp/categories/:id
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	updatedCategory, err := h.categoryService.UpdateCategory(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if updatedCategory == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Category not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    updatedCategory,
		"message": "Category updated successfully",
	})
}

// DeleteCategory handles DELETE /api/erp/categories/:id
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	if err := h.categoryService.DeleteCategory(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Category deleted successfully",
	})
}

// GetSubcategories handles GET /api/erp/categories/:id/subcategories
func (h *CategoryHandler) GetSubcategories(c *gin.Context) {
	parentID := c.Param("id")

	subcategories, err := h.categoryService.GetSubcategories(parentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"subcategories": subcategories,
			"count":         len(subcategories),
		},
	})
}

// GetRootCategories handles GET /api/erp/categories/root
func (h *CategoryHandler) GetRootCategories(c *gin.Context) {
	categories, err := h.categoryService.GetRootCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"categories": categories,
			"count":      len(categories),
		},
	})
}
