package services

import (
	"context"
	"fmt"
	"os"

	"github.com/sashabaranov/go-openai"
)

// GMBContentService generates AI-powered content for GMB posts
type GMBContentService struct {
	client *openai.Client
}

// NewGMBContentService creates a new GMB content service
func NewGMBContentService(apiKey string) *GMBContentService {
	if apiKey == "" {
		apiKey = os.Getenv("OPENAI_API_KEY")
	}

	return &GMBContentService{
		client: openai.NewClient(apiKey),
	}
}

// GenerateHealthPost generates a health-related post for GMB
func (s *GMBContentService) GenerateHealthPost(topic, tone string) (title, content string, err error) {
	if topic == "" {
		return "", "", fmt.Errorf("topic is required")
	}

	if tone == "" {
		tone = "informative and friendly"
	}

	prompt := fmt.Sprintf(`Create a Google My Business post for Yeelo Homeopathy about "%s".

Requirements:
- Tone: %s
- Focus on homeopathy treatments and remedies
- Include practical health tips
- Keep title under 58 characters
- Keep content between 100-300 words (maximum 1500 characters)
- Use simple, accessible language for general public
- Mention specific homeopathic remedies where appropriate
- Add emotional appeal to connect with readers
- Include a subtle call-to-action at the end

Format your response as:
TITLE: [your title here]
CONTENT: [your content here]`, topic, tone)

	resp, err := s.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are an expert homeopathy content writer creating engaging Google My Business posts for Yeelo Homeopathy clinic in India. Focus on natural healing, preventive care, and homeopathic remedies.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.7,
			MaxTokens:   500,
		},
	)

	if err != nil {
		return "", "", fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", "", fmt.Errorf("no content generated")
	}

	// Parse the response
	responseText := resp.Choices[0].Message.Content
	title, content = s.parseResponse(responseText)

	return title, content, nil
}

// GenerateSeasonalPost generates a seasonal health post
func (s *GMBContentService) GenerateSeasonalPost(season string) (title, content string, err error) {
	seasonTopics := map[string]string{
		"winter":  "winter immunity and cold prevention with homeopathy",
		"summer":  "summer heat management and hydration tips with homeopathic support",
		"monsoon": "monsoon diseases like dengue, malaria prevention with homeopathy",
		"festive": "healthy festive season tips with homeopathic remedies for digestion",
	}

	topic, exists := seasonTopics[season]
	if !exists {
		topic = "seasonal health and wellness with homeopathy"
	}

	return s.GenerateHealthPost(topic, "caring and preventive")
}

// GenerateDiseaseAwarenessPost generates a disease awareness post
func (s *GMBContentService) GenerateDiseaseAwarenessPost(disease string) (title, content string, err error) {
	if disease == "" {
		return "", "", fmt.Errorf("disease is required")
	}

	topic := fmt.Sprintf("%s prevention and homeopathic management", disease)
	return s.GenerateHealthPost(topic, "informative and reassuring")
}

// parseResponse extracts title and content from AI response
func (s *GMBContentService) parseResponse(response string) (title, content string) {
	// Simple parsing - look for TITLE: and CONTENT: markers
	lines := splitLines(response)

	var titleLines, contentLines []string
	currentSection := ""

	for _, line := range lines {
		if len(line) >= 6 && line[:6] == "TITLE:" {
			currentSection = "title"
			// Get the rest of the line after "TITLE:"
			if len(line) > 7 {
				titleLines = append(titleLines, line[7:])
			}
			continue
		}
		if len(line) >= 8 && line[:8] == "CONTENT:" {
			currentSection = "content"
			// Get the rest of the line after "CONTENT:"
			if len(line) > 9 {
				contentLines = append(contentLines, line[9:])
			}
			continue
		}

		if currentSection == "title" && line != "" {
			titleLines = append(titleLines, line)
		} else if currentSection == "content" && line != "" {
			contentLines = append(contentLines, line)
		}
	}

	// Join the lines
	title = joinLines(titleLines)
	content = joinLines(contentLines)

	// Fallback if parsing failed
	if title == "" {
		// Take first 58 chars as title
		if len(response) > 58 {
			title = response[:58]
			content = response[58:]
		} else {
			title = response
			content = "Discover natural healing with homeopathy at Yeelo Homeopathy."
		}
	}

	// Trim whitespace
	title = trimSpace(title)
	content = trimSpace(content)

	return title, content
}

// Helper functions for string manipulation
func splitLines(s string) []string {
	var lines []string
	var current string

	for i := range s {
		if s[i] == '\n' {
			lines = append(lines, current)
			current = ""
		} else {
			current += string(s[i])
		}
	}
	if current != "" {
		lines = append(lines, current)
	}

	return lines
}

func joinLines(lines []string) string {
	result := ""
	for i, line := range lines {
		if i > 0 {
			result += " "
		}
		result += line
	}
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)

	// Trim leading space
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}

	// Trim trailing space
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}

	return s[start:end]
}
