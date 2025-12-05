package services

import (
	"time"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type GMBAnalyticsService struct {
	DB *gorm.DB
}

func NewGMBAnalyticsService(db *gorm.DB) *GMBAnalyticsService {
	return &GMBAnalyticsService{DB: db}
}

type CategoryStat struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

type MonthStat struct {
	Year  int    `json:"year"`
	Month string `json:"month"`
	Count int    `json:"count"`
}

// GroupByCategory returns post counts grouped by category
func (s *GMBAnalyticsService) GroupByCategory(accountID string) ([]CategoryStat, error) {
	var stats []CategoryStat
	err := s.DB.Model(&models.GMBPost{}).
		Select("category, count(*) as count").
		Where("gmb_account_id = ?", accountID).
		Group("category").
		Scan(&stats).Error
	return stats, err
}

// GroupByMonth returns post counts grouped by month
func (s *GMBAnalyticsService) GroupByMonth(accountID string) ([]MonthStat, error) {
	var results []struct {
		Year  int
		Month int
		Count int
	}

	// PostgreSQL specific date truncation
	err := s.DB.Model(&models.GMBPost{}).
		Select("EXTRACT(YEAR FROM created_at) as year, EXTRACT(MONTH FROM created_at) as month, count(*) as count").
		Where("gmb_account_id = ?", accountID).
		Group("year, month").
		Order("year DESC, month DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	stats := make([]MonthStat, len(results))
	for i, r := range results {
		stats[i] = MonthStat{
			Year:  r.Year,
			Month: time.Month(r.Month).String(),
			Count: r.Count,
		}
	}
	return stats, nil
}

// GroupBySubCategory returns post counts grouped by subcategory
func (s *GMBAnalyticsService) GroupBySubCategory(accountID string) ([]CategoryStat, error) {
	var stats []CategoryStat
	err := s.DB.Model(&models.GMBPost{}).
		Select("sub_category as category, count(*) as count").
		Where("gmb_account_id = ? AND sub_category != ''", accountID).
		Group("sub_category").
		Scan(&stats).Error
	return stats, err
}

// GetMissingCategories returns a list of required categories that haven't been used recently
func (s *GMBAnalyticsService) GetMissingCategories(accountID string) ([]string, error) {
	requiredCategories := []string{
		"Mother Tinctures", "Dilutions (Potencies)", "Biochemic Salts",
		"Ointments & Creams", "Syrups & Drops", "Kids Remedies",
		"Seasonal Medicines", "Offers & Discounts", "Clinic Updates",
		"Educational/Tips",
	}

	// Get categories used in the last 90 days
	var usedCategories []string
	threeMonthsAgo := time.Now().AddDate(0, -3, 0)

	err := s.DB.Model(&models.GMBPost{}).
		Distinct("category").
		Where("gmb_account_id = ? AND created_at >= ?", accountID, threeMonthsAgo).
		Pluck("category", &usedCategories).Error

	if err != nil {
		return nil, err
	}

	usedMap := make(map[string]bool)
	for _, c := range usedCategories {
		usedMap[c] = true
	}

	var missing []string
	for _, req := range requiredCategories {
		if !usedMap[req] {
			missing = append(missing, req)
		}
	}

	return missing, nil
}
