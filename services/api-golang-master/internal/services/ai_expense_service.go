package services

import (
	"strings"

	"gorm.io/gorm"
)

type AIExpenseService struct {
	DB *gorm.DB
}

func NewAIExpenseService(db *gorm.DB) *AIExpenseService {
	return &AIExpenseService{DB: db}
}

type ExpenseCategory struct {
	Category      string   `json:"category"`
	Confidence    float64  `json:"confidence"`
	Reasoning     string   `json:"reasoning"`
	SuggestedTags []string `json:"suggested_tags"`
}

// CategorizeExpense suggests a category for an expense description
func (s *AIExpenseService) CategorizeExpense(description string, amount float64) (*ExpenseCategory, error) {
	// In a real implementation, this would call OpenAI
	// For now, we'll use a rule-based system enhanced with "AI-like" logic

	description = strings.ToLower(description)

	category := "Uncategorized"
	confidence := 0.5
	reasoning := "Could not determine category with high confidence."
	tags := []string{}

	// Rule-based logic (simulating AI training data)
	if containsAny(description, []string{"uber", "ola", "taxi", "cab", "flight", "train", "bus", "travel", "hotel", "airbnb"}) {
		category = "Travel & Transport"
		confidence = 0.9
		reasoning = "Keywords related to transportation or accommodation found."
		tags = []string{"travel", "business_trip"}
	} else if containsAny(description, []string{"lunch", "dinner", "coffee", "food", "restaurant", "swiggy", "zomato", "meal"}) {
		category = "Meals & Entertainment"
		confidence = 0.85
		reasoning = "Food or dining related keywords identified."
		tags = []string{"meals", "client_meeting"}
	} else if containsAny(description, []string{"laptop", "computer", "mouse", "keyboard", "monitor", "software", "subscription", "aws", "google", "cloud", "internet", "wifi"}) {
		category = "IT & Software"
		confidence = 0.95
		reasoning = "Technology hardware or software subscription detected."
		tags = []string{"tech", "infrastructure"}
	} else if containsAny(description, []string{"paper", "pen", "notebook", "printer", "ink", "toner", "office", "desk", "chair"}) {
		category = "Office Supplies"
		confidence = 0.8
		reasoning = "Common office supply items found."
		tags = []string{"office", "consumables"}
	} else if containsAny(description, []string{"rent", "lease", "electricity", "water", "bill", "utility", "power"}) {
		category = "Rent & Utilities"
		confidence = 0.9
		reasoning = "Utility or facility cost keywords found."
		tags = []string{"utilities", "fixed_cost"}
	} else if containsAny(description, []string{"salary", "wage", "bonus", "payroll", "consultant", "contractor"}) {
		category = "Payroll & Consultants"
		confidence = 0.9
		reasoning = "Personnel cost related terms identified."
		tags = []string{"hr", "payroll"}
	} else if containsAny(description, []string{"ad", "advertisement", "marketing", "promo", "facebook", "instagram", "google ads", "linkedin"}) {
		category = "Marketing & Advertising"
		confidence = 0.85
		reasoning = "Marketing channel or advertising keywords found."
		tags = []string{"marketing", "campaign"}
	}

	// Adjust confidence based on amount (heuristics)
	if amount > 10000 && category == "Meals & Entertainment" {
		confidence -= 0.2
		reasoning += " However, amount is unusually high for this category."
	}

	return &ExpenseCategory{
		Category:      category,
		Confidence:    confidence,
		Reasoning:     reasoning,
		SuggestedTags: tags,
	}, nil
}

func containsAny(s string, substrings []string) bool {
	for _, sub := range substrings {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}
