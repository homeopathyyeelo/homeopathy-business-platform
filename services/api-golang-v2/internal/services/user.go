package services

import (
"time"
	"errors"
	"github.com/yeelo/homeopathy-erp/internal/database"
	"github.com/yeelo/homeopathy-erp/internal/models"
)

type UserService struct{}

func NewUserService() *UserService {
	return &UserService{}
}

func (s *UserService) CreateUser(user *models.User) error {
	return database.DB.Create(user).Error
}

func (s *UserService) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, "email = ?", email).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, "username = ?", username).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) GetUserByEmailOrUsername(email, username string) (*models.User, error) {
	var user models.User
	query := database.DB

	if email != "" {
		query = query.Where("email = ?", email)
	} else if username != "" {
		query = query.Where("username = ?", username)
	} else {
		return nil, errors.New("email or username required")
	}

	err := query.First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateUser(id string, updates map[string]interface{}) error {
	return database.DB.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error
}

func (s *UserService) DeleteUser(id string) error {
	return database.DB.Delete(&models.User{}, "id = ?", id).Error
}

func (s *UserService) ListUsers(page, limit int, search string) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	query := database.DB.Model(&models.User{})

	if search != "" {
		query = query.Where("email ILIKE ? OR username ILIKE ? OR full_name ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	offset := (page - 1) * limit
	err := query.Limit(limit).Offset(offset).Find(&users).Error

	return users, total, err
}

func (s *UserService) ActivateUser(id string) error {
	return s.UpdateUser(id, map[string]interface{}{"is_active": true})
}

func (s *UserService) DeactivateUser(id string) error {
	return s.UpdateUser(id, map[string]interface{}{"is_active": false})
}

func (s *UserService) UpdateLastLogin(id string) error {
	now := time.Now()
	return s.UpdateUser(id, map[string]interface{}{"last_login": &now})
}
