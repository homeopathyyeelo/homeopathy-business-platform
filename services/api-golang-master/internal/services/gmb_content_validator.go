package services

import (
	"fmt"
	"regexp"
	"strings"
)

// ContentValidationResult represents the result of content validation
type ContentValidationResult struct {
	IsValid         bool     `json:"is_valid"`
	Status          string   `json:"status"` // "approved", "blocked", "needs_review"
	Violations      []string `json:"violations"`
	Warnings        []string `json:"warnings"`
	RejectionReason string   `json:"rejection_reason,omitempty"`
}

type GMBContentValidator struct{}

// Error definitions
var (
	ErrTitleTooLong   = fmt.Errorf("title exceeds maximum length of 58 characters")
	ErrContentTooLong = fmt.Errorf("content exceeds maximum length of 1500 characters")
)

// NewGMBContentValidator creates a new content validator
func NewGMBContentValidator() *GMBContentValidator {
	return &GMBContentValidator{}
}

// Blocked keywords - auto-reject
var blockedKeywords = []string{
	"doctor", `dr\.`, "physician", "medical expert", "clinic", "treatment center",
	"diagnose", "cure", "heal disease", "treat cancer", "treat hiv",
	"cancer cure", "hiv cure", "aids cure", "diabetes cure", "heart disease cure",
	"prescription", "rx only", "therapy center", "medical therapy", "clinical trial",
	"guaranteed cure", "100% cure", "miracle cure",
}

// Warning keywords - require manual review
var warningKeywords = []string{
	"relief from", "remedy for", "supports treatment",
	"medical advice", "diagnosis", "symptoms",
	"disease", "illness", "ailment", "disorder",
}

// Sensitive disease names - blocked
var sensitiveDiseases = []string{
	"cancer", "hiv", "aids", "tumor", "malignant",
	"heart attack", "stroke", "kidney failure",
	"liver failure", "terminal", "fatal",
}

// ValidateContent validates post content against compliance rules
func (v *GMBContentValidator) ValidateContent(title, content string) *ContentValidationResult {
	result := &ContentValidationResult{
		IsValid:    true,
		Status:     "approved",
		Violations: []string{},
		Warnings:   []string{},
	}

	fullText := strings.ToLower(title + " " + content)

	// Debug logging
	fmt.Printf("[VALIDATOR DEBUG] Checking content: %s\n", fullText)

	// Check for blocked keywords
	for _, keyword := range blockedKeywords {
		pattern := regexp.MustCompile(`\b` + keyword + `\b`)
		if pattern.MatchString(fullText) {
			result.IsValid = false
			result.Status = "blocked"
			result.Violations = append(result.Violations, "Contains prohibited term: "+keyword)
			fmt.Printf("[VALIDATOR DEBUG] BLOCKED by keyword: %s\n", keyword)
		}
	}

	// Check for sensitive diseases
	for _, disease := range sensitiveDiseases {
		pattern := regexp.MustCompile(`\b` + disease + `\b`)
		if pattern.MatchString(fullText) {
			result.IsValid = false
			result.Status = "blocked"
			result.Violations = append(result.Violations, "Contains sensitive disease name: "+disease)
			fmt.Printf("[VALIDATOR DEBUG] BLOCKED by disease: %s\n", disease)
		}
	}

	// If already blocked, set rejection reason and return
	if result.Status == "blocked" {
		result.RejectionReason = "Content violates pharmacy compliance rules. " + strings.Join(result.Violations, "; ")
		fmt.Printf("[VALIDATOR DEBUG] Final result: BLOCKED with %d violations\n", len(result.Violations))
		return result
	}

	// Check for warning keywords
	for _, keyword := range warningKeywords {
		pattern := regexp.MustCompile(`\b` + keyword + `\b`)
		if pattern.MatchString(fullText) {
			result.Warnings = append(result.Warnings, "Contains term requiring review: "+keyword)
		}
	}

	// If warnings exist, require manual review
	if len(result.Warnings) > 0 {
		result.Status = "needs_review"
		result.IsValid = true // Still valid, but needs approval
	}

	return result
}

// ValidateTitleLength validates title length for GMB requirements
func (v *GMBContentValidator) ValidateTitleLength(title string) error {
	if len(title) > 58 {
		return ErrTitleTooLong
	}
	return nil
}

// ValidateContentLength validates content length for GMB requirements
func (v *GMBContentValidator) ValidateContentLength(content string) error {
	if len(content) > 1500 {
		return ErrContentTooLong
	}
	return nil
}
