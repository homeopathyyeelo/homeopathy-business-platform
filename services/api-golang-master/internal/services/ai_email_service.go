package services

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

type AIEmailService struct {
	DB *gorm.DB
}

func NewAIEmailService(db *gorm.DB) *AIEmailService {
	return &AIEmailService{DB: db}
}

type EmailDraft struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
	Tone    string `json:"tone"`
}

// GenerateEmail generates an email draft based on purpose and customer details
func (s *AIEmailService) GenerateEmail(customerName, purpose, tone string, keyPoints []string) (*EmailDraft, error) {
	// In a real implementation, this would call OpenAI
	// For now, we'll use templates with dynamic insertion

	subject := ""
	body := ""

	switch purpose {
	case "welcome":
		subject = fmt.Sprintf("Welcome to Homeopathy ERP, %s! 🌱", customerName)
		body = fmt.Sprintf(`Dear %s,

We are thrilled to welcome you to the Homeopathy ERP family!

We are committed to supporting your journey towards better health management. Our platform is designed to make your experience seamless and effective.

%s

If you have any questions, our support team is just a click away.

Warm regards,
The Team`, customerName, formatKeyPoints(keyPoints))

	case "follow_up":
		subject = fmt.Sprintf("Checking in on your progress, %s", customerName)
		body = fmt.Sprintf(`Hi %s,

I wanted to personally reach out and see how you're doing with your current treatment plan.

%s

Your feedback is incredibly valuable to us. Please let us know if you need any adjustments.

Best,
Dr. Smith`, customerName, formatKeyPoints(keyPoints))

	case "promotion":
		subject = fmt.Sprintf("Exclusive Offer for You, %s! 🎁", customerName)
		body = fmt.Sprintf(`Hello %s,

We have something special just for you!

%s

Don't miss out on this opportunity to enhance your wellness journey.

Cheers,
Marketing Team`, customerName, formatKeyPoints(keyPoints))

	default:
		subject = fmt.Sprintf("Message regarding %s", purpose)
		body = fmt.Sprintf("Dear %s,\n\n%s\n\nBest regards,", customerName, formatKeyPoints(keyPoints))
	}

	// Adjust tone
	if tone == "formal" {
		body = strings.Replace(body, "Hi", "Dear", 1)
		body = strings.Replace(body, "Cheers", "Sincerely", 1)
	} else if tone == "casual" {
		body = strings.Replace(body, "Dear", "Hi", 1)
		body = strings.Replace(body, "Sincerely", "Cheers", 1)
	}

	return &EmailDraft{
		Subject: subject,
		Body:    body,
		Tone:    tone,
	}, nil
}

func formatKeyPoints(points []string) string {
	if len(points) == 0 {
		return ""
	}
	formatted := ""
	for _, p := range points {
		formatted += fmt.Sprintf("- %s\n", p)
	}
	return formatted
}
