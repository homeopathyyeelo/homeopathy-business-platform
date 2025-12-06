package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type MarketingAIService struct {
	ModelURL  string
	ModelName string
}

func NewMarketingAIService(modelURL, modelName string) *MarketingAIService {
	if modelURL == "" {
		modelURL = "http://localhost:11434/api/generate" // Default to Ollama
	}
	if modelName == "" {
		modelName = "mistral" // Default model
	}
	return &MarketingAIService{
		ModelURL:  modelURL,
		ModelName: modelName,
	}
}

// UserProfile matches the struct in handlers
type UserProfile struct {
	Name         string   `json:"name"`
	PhoneNumber  string   `json:"phone_number"`
	Conditions   []string `json:"conditions"`
	LastPurchase string   `json:"last_purchase"`
}

// GenerateMessage constructs a prompt and calls the LLM
func (s *MarketingAIService) GenerateMessage(user UserProfile, msgType string, offer string) (string, error) {
	var prompt string

	// Construct prompt based on message type (using user's templates)
	switch msgType {
	case "recommendation":
		prompt = fmt.Sprintf(
			"You are Yeelo Homeopathy’s pharmacy assistant. Compose a WhatsApp message for customer %s, who has %v and last purchased %s. Suggest a gentle, general recommendation. If possible, mention our current offer: %s. Keep it friendly and positive.",
			user.Name, user.Conditions, user.LastPurchase, offer,
		)
	case "offer":
		prompt = fmt.Sprintf(
			"You are Yeelo Homeopathy’s virtual assistant. Write a short, warm WhatsApp message for %s about our latest offer: %s. If possible, connect it to their interest in %v or their last purchase (%s). End on an inviting note.",
			user.Name, offer, user.Conditions, user.LastPurchase,
		)
	case "transactional":
		prompt = fmt.Sprintf(
			"You are Yeelo Homeopathy’s customer service agent. Compose a short, courteous WhatsApp message informing %s about the status of their order. Include a thank you.",
			user.Name,
		)
	default:
		prompt = fmt.Sprintf(
			"Compose a friendly WhatsApp message for %s regarding %s.",
			user.Name, msgType,
		)
	}

	return s.callLLM(prompt)
}

// GenerateSocialContent generates content for social media
func (s *MarketingAIService) GenerateSocialContent(prompt string, topic string) (string, error) {
	fullPrompt := fmt.Sprintf("Write a social media post about %s. %s", topic, prompt)
	return s.callLLM(fullPrompt)
}

func (s *MarketingAIService) callLLM(prompt string) (string, error) {
	payload := map[string]interface{}{
		"model":  s.ModelName,
		"prompt": prompt,
		"stream": false, // We want the full response at once
	}

	jsonPayload, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", s.ModelURL, bytes.NewBuffer(jsonPayload))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Handle Ollama response format
	var response struct {
		Response string `json:"response"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", err
	}

	return response.Response, nil
}
