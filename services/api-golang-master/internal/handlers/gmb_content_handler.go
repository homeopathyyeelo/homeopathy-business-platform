package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/models"
	"github.com/yeelo/homeopathy-erp/internal/services"
	"gorm.io/gorm"
)

type GMBContentHandler struct {
	DB             *gorm.DB
	contentService *services.GMBContentService
}

func NewGMBContentHandler(db *gorm.DB, contentService *services.GMBContentService) *GMBContentHandler {
	return &GMBContentHandler{
		DB:             db,
		contentService: contentService,
	}
}

type GenerateRequest struct {
	Topic      string   `json:"topic"`
	Tone       string   `json:"tone"`
	ProductIDs []string `json:"product_ids"`
}

type GenerateResponse struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// GenerateByTopic generates content based on a custom topic
func (h *GMBContentHandler) GenerateByTopic(c *gin.Context) {
	var req GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	products, err := h.fetchProducts(req.ProductIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	title, content, err := h.contentService.GenerateHealthPost(req.Topic, req.Tone, products)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": GenerateResponse{
			Title:   title,
			Content: content,
		},
	})
}

// GenerateBySeason generates content for a specific season
func (h *GMBContentHandler) GenerateBySeason(c *gin.Context) {
	var req struct {
		Season     string   `json:"season" binding:"required"`
		ProductIDs []string `json:"product_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Season is required"})
		return
	}

	products, err := h.fetchProducts(req.ProductIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	title, content, err := h.contentService.GenerateSeasonalPost(req.Season, products)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": GenerateResponse{
			Title:   title,
			Content: content,
		},
	})
}

// GenerateByDisease generates content for a specific disease
func (h *GMBContentHandler) GenerateByDisease(c *gin.Context) {
	var req struct {
		Disease    string   `json:"disease" binding:"required"`
		ProductIDs []string `json:"product_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Disease is required"})
		return
	}

	products, err := h.fetchProducts(req.ProductIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	title, content, err := h.contentService.GenerateDiseaseAwarenessPost(req.Disease, products)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": GenerateResponse{
			Title:   title,
			Content: content,
		},
	})
}

// fetchProducts retrieves product details from the database
func (h *GMBContentHandler) fetchProducts(ids []string) ([]models.Product, error) {
	if len(ids) == 0 {
		return []models.Product{}, nil
	}

	var products []models.Product
	err := h.DB.Where("id IN ?", ids).Find(&products).Error
	return products, err
}
