package services

import (
	"gorm.io/gorm"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type PriceListService struct {
	db *gorm.DB
}

func NewPriceListService() *PriceListService {
	return &PriceListService{
		db: database.GetDB(),
	}
}

func (s *PriceListService) ListPriceLists(page, limit int, search string) ([]models.PriceList, int64, error) {
	var priceLists []models.PriceList
	var total int64

	query := s.db.Model(&models.PriceList{}).Preload("Items").Preload("Items.Product")

	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("name ASC").Find(&priceLists).Error

	return priceLists, total, err
}

func (s *PriceListService) GetPriceListByID(id string) (*models.PriceList, error) {
	var priceList models.PriceList
	err := s.db.Preload("Items").Preload("Items.Product").Where("id = ?", id).First(&priceList).Error
	return &priceList, err
}

func (s *PriceListService) CreatePriceList(priceList *models.PriceList) error {
	return s.db.Create(priceList).Error
}

func (s *PriceListService) UpdatePriceList(id string, updates *models.PriceList) error {
	return s.db.Model(&models.PriceList{}).Where("id = ?", id).Updates(updates).Error
}

func (s *PriceListService) DeletePriceList(id string) error {
	// First delete all items in the price list
	if err := s.db.Where("price_list_id = ?", id).Delete(&models.ProductPriceListItem{}).Error; err != nil {
		return err
	}
	// Then delete the price list
	return s.db.Delete(&models.PriceList{}, "id = ?", id).Error
}

func (s *PriceListService) AddProductToPriceList(item *models.ProductPriceListItem) error {
	return s.db.Create(item).Error
}

func (s *PriceListService) RemoveProductFromPriceList(priceListID, productID string) error {
	return s.db.Where("price_list_id = ? AND product_id = ?", priceListID, productID).Delete(&models.ProductPriceListItem{}).Error
}
