package services

import (
	"encoding/json"
	"os"
	"sync"

	"gorm.io/gorm"
)

// ConfigService provides centralized configuration management
type ConfigService struct {
	db    *gorm.DB
	cache map[string]interface{}
	mu    sync.RWMutex
}

// NewConfigService creates a new configuration service
func NewConfigService(db *gorm.DB) *ConfigService {
	return &ConfigService{
		db:    db,
		cache: make(map[string]interface{}),
	}
}

// GetOpenAIAPIKey gets OpenAI API key from database or environment
func (s *ConfigService) GetOpenAIAPIKey() string {
	// Check cache first
	s.mu.RLock()
	if cached, ok := s.cache["openai_api_key"]; ok {
		s.mu.RUnlock()
		return cached.(string)
	}
	s.mu.RUnlock()

	// Try database first
	var setting struct {
		Value json.RawMessage `gorm:"column:value"`
	}

	err := s.db.Table("app_settings").
		Select("value").
		Where("key = ?", "ai.openai.apiKey").
		First(&setting).Error

	if err == nil && len(setting.Value) > 0 {
		var apiKey string
		if err := json.Unmarshal(setting.Value, &apiKey); err == nil && apiKey != "" {
			// Cache it
			s.mu.Lock()
			s.cache["openai_api_key"] = apiKey
			s.mu.Unlock()
			return apiKey
		}
	}

	// Fallback to environment variable
	envKey := os.Getenv("OPENAI_API_KEY")
	if envKey != "" {
		// Cache it
		s.mu.Lock()
		s.cache["openai_api_key"] = envKey
		s.mu.Unlock()
		return envKey
	}

	return ""
}

// GetOpenAIModel gets OpenAI model from database or uses default
func (s *ConfigService) GetOpenAIModel() string {
	// Check cache first
	s.mu.RLock()
	if cached, ok := s.cache["openai_model"]; ok {
		s.mu.RUnlock()
		return cached.(string)
	}
	s.mu.RUnlock()

	// Try database first
	var setting struct {
		Value json.RawMessage `gorm:"column:value"`
	}

	err := s.db.Table("app_settings").
		Select("value").
		Where("key = ?", "ai.openai.model").
		First(&setting).Error

	if err == nil && len(setting.Value) > 0 {
		var model string
		if err := json.Unmarshal(setting.Value, &model); err == nil && model != "" {
			// Cache it
			s.mu.Lock()
			s.cache["openai_model"] = model
			s.mu.Unlock()
			return model
		}
	}

	// Default
	defaultModel := "gpt-4o-mini"
	s.mu.Lock()
	s.cache["openai_model"] = defaultModel
	s.mu.Unlock()
	return defaultModel
}

// GetOpenAIProjectName gets OpenAI project name from database or environment
func (s *ConfigService) GetOpenAIProjectName() string {
	// Check cache first
	s.mu.RLock()
	if cached, ok := s.cache["openai_project_name"]; ok {
		s.mu.RUnlock()
		return cached.(string)
	}
	s.mu.RUnlock()

	// Try database first
	var setting struct {
		Value json.RawMessage `gorm:"column:value"`
	}

	err := s.db.Table("app_settings").
		Select("value").
		Where("key = ?", "ai.openai.projectName").
		First(&setting).Error

	if err == nil && len(setting.Value) > 0 {
		var projectName string
		if err := json.Unmarshal(setting.Value, &projectName); err == nil && projectName != "" {
			// Cache it
			s.mu.Lock()
			s.cache["openai_project_name"] = projectName
			s.mu.Unlock()
			return projectName
		}
	}

	// Fallback to environment variable
	envName := os.Getenv("OPENAI_PROJECT_NAME")
	if envName != "" {
		// Cache it
		s.mu.Lock()
		s.cache["openai_project_name"] = envName
		s.mu.Unlock()
		return envName
	}

	return "YeeloHomeopathy" // Default
}

// GetOpenAIProjectID gets OpenAI project ID from database or environment
func (s *ConfigService) GetOpenAIProjectID() string {
	// Check cache first
	s.mu.RLock()
	if cached, ok := s.cache["openai_project_id"]; ok {
		s.mu.RUnlock()
		return cached.(string)
	}
	s.mu.RUnlock()

	// Try database first
	var setting struct {
		Value json.RawMessage `gorm:"column:value"`
	}

	err := s.db.Table("app_settings").
		Select("value").
		Where("key = ?", "ai.openai.projectId").
		First(&setting).Error

	if err == nil && len(setting.Value) > 0 {
		var projectID string
		if err := json.Unmarshal(setting.Value, &projectID); err == nil && projectID != "" {
			// Cache it
			s.mu.Lock()
			s.cache["openai_project_id"] = projectID
			s.mu.Unlock()
			return projectID
		}
	}

	// Fallback to environment variable
	envID := os.Getenv("OPENAI_PROJECT_ID")
	if envID != "" {
		// Cache it
		s.mu.Lock()
		s.cache["openai_project_id"] = envID
		s.mu.Unlock()
		return envID
	}

	return "" // No default for project ID
}

// IsAIEnabled checks if AI features are enabled
func (s *ConfigService) IsAIEnabled() bool {
	// Check cache first
	s.mu.RLock()
	if cached, ok := s.cache["ai_enabled"]; ok {
		s.mu.RUnlock()
		return cached.(bool)
	}
	s.mu.RUnlock()

	// Try database first
	var setting struct {
		Value json.RawMessage `gorm:"column:value"`
	}

	err := s.db.Table("app_settings").
		Select("value").
		Where("key = ?", "ai.enabled").
		First(&setting).Error

	if err == nil && len(setting.Value) > 0 {
		var enabled bool
		if err := json.Unmarshal(setting.Value, &enabled); err == nil {
			// Cache it
			s.mu.Lock()
			s.cache["ai_enabled"] = enabled
			s.mu.Unlock()
			return enabled
		}
	}

	// Default to true
	s.mu.Lock()
	s.cache["ai_enabled"] = true
	s.mu.Unlock()
	return true
}

// GetSetting gets any setting by key from database
func (s *ConfigService) GetSetting(key string) (interface{}, error) {
	var setting struct {
		Value json.RawMessage `gorm:"column:value"`
		Type  string          `gorm:"column:type"`
	}

	err := s.db.Table("app_settings").
		Select("value, type").
		Where("key = ?", key).
		First(&setting).Error

	if err != nil {
		return nil, err
	}

	// Parse based on type
	switch setting.Type {
	case "string":
		var value string
		json.Unmarshal(setting.Value, &value)
		return value, nil
	case "number":
		var value float64
		json.Unmarshal(setting.Value, &value)
		return value, nil
	case "boolean":
		var value bool
		json.Unmarshal(setting.Value, &value)
		return value, nil
	case "json":
		var value map[string]interface{}
		json.Unmarshal(setting.Value, &value)
		return value, nil
	default:
		return string(setting.Value), nil
	}
}

// ClearCache clears the configuration cache
func (s *ConfigService) ClearCache() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cache = make(map[string]interface{})
}

// Global config service instance
var globalConfigService *ConfigService
var configOnce sync.Once

// GetConfigService returns the global config service instance
func GetConfigService(db *gorm.DB) *ConfigService {
	configOnce.Do(func() {
		globalConfigService = NewConfigService(db)
	})
	return globalConfigService
}
