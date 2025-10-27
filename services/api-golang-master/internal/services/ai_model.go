package services

import (
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type AIModelService struct {
	db *gorm.DB
}

func NewAIModelService() *AIModelService {
	return &AIModelService{
		db: database.GetDB(),
	}
}

func (s *AIModelService) ListAIModels(page, limit int, search, modelType string) ([]models.AIModel, int64, error) {
	var aiModels []models.AIModel
	var total int64

	query := s.db.Model(&models.AIModel{})

	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if modelType != "" {
		query = query.Where("model_type = ?", modelType)
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("name ASC").Find(&aiModels).Error

	return aiModels, total, err
}

func (s *AIModelService) GetAIModelByID(id string) (*models.AIModel, error) {
	var aiModel models.AIModel
	err := s.db.Where("id = ?", id).First(&aiModel).Error
	return &aiModel, err
}

func (s *AIModelService) CreateAIModel(aiModel *models.AIModel) error {
	return s.db.Create(aiModel).Error
}

func (s *AIModelService) UpdateAIModel(id string, updates *models.AIModel) error {
	return s.db.Model(&models.AIModel{}).Where("id = ?", id).Updates(updates).Error
}

func (s *AIModelService) DeleteAIModel(id string) error {
	return s.db.Delete(&models.AIModel{}, "id = ?", id).Error
}

func (s *AIModelService) ToggleAIModel(id string) error {
	return s.db.Model(&models.AIModel{}).Where("id = ?", id).Update("is_active", s.db.Raw("NOT is_active")).Error
}
