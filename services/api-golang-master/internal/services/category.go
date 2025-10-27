package services

import (
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type CategoryService struct {
	db *gorm.DB
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{
		db: db,
	}
}

// GetAllCategories retrieves all active categories with optional filtering and pagination
func (s *CategoryService) GetAllCategories(limit, offset int, search string, parentID *string) ([]models.Category, int64, error) {
	var categories []models.Category
	var total int64

	query := s.db.Model(&models.Category{}).Where("is_active = ?", true)

	// Apply filters
	if search != "" {
		query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if parentID != nil && *parentID != "" {
		query = query.Where("parent_id = ?", *parentID)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count categories: %w", err)
	}

	// Get categories with pagination
	if err := query.
		Limit(limit).
		Offset(offset).
		Order("name ASC").
		Find(&categories).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get categories: %w", err)
	}

	return categories, total, nil
}

// GetCategoryByID retrieves a category by its ID
func (s *CategoryService) GetCategoryByID(id string) (*models.Category, error) {
	var category models.Category
	if err := s.db.Where("id = ? AND is_active = ?", id, true).First(&category).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	return &category, nil
}

// CreateCategory creates a new category
func (s *CategoryService) CreateCategory(category *models.Category) (*models.Category, error) {
	// Generate UUID if not provided
	if category.ID == "" {
		category.ID = uuid.New().String()
	}

	if err := s.db.Create(category).Error; err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return category, nil
}

// UpdateCategory updates an existing category
func (s *CategoryService) UpdateCategory(id string, updates map[string]interface{}) (*models.Category, error) {
	if err := s.db.Model(&models.Category{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return s.GetCategoryByID(id)
}

// DeleteCategory soft deletes a category (sets is_active to false)
func (s *CategoryService) DeleteCategory(id string) error {
	if err := s.db.Model(&models.Category{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	return nil
}

// GetSubcategories retrieves all subcategories for a given parent category
func (s *CategoryService) GetSubcategories(parentID string) ([]models.Category, error) {
	var categories []models.Category
	if err := s.db.Where("parent_id = ? AND is_active = ?", parentID, true).
		Order("name ASC").
		Find(&categories).Error; err != nil {
		return nil, fmt.Errorf("failed to get subcategories: %w", err)
	}

	return categories, nil
}

// GetRootCategories retrieves all root categories (those without a parent)
func (s *CategoryService) GetRootCategories() ([]models.Category, error) {
	var categories []models.Category
	if err := s.db.Where("parent_id IS NULL AND is_active = ?", true).
		Order("name ASC").
		Find(&categories).Error; err != nil {
		return nil, fmt.Errorf("failed to get root categories: %w", err)
	}

	return categories, nil
}
