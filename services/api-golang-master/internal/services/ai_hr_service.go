package services

import (
	"math"
	"strings"

	"gorm.io/gorm"
)

type AIHRService struct {
	DB *gorm.DB
}

func NewAIHRService(db *gorm.DB) *AIHRService {
	return &AIHRService{DB: db}
}

type AttritionPrediction struct {
	EmployeeID        string   `json:"employee_id"`
	EmployeeName      string   `json:"employee_name"`
	AttritionRisk     float64  `json:"attrition_risk"` // 0-1
	RiskFactors       []string `json:"risk_factors"`
	RetentionStrategy string   `json:"retention_strategy"`
}

type ResumeScreening struct {
	CandidateName string   `json:"candidate_name"`
	MatchScore    float64  `json:"match_score"` // 0-100
	MatchedSkills []string `json:"matched_skills"`
	MissingSkills []string `json:"missing_skills"`
	Summary       string   `json:"summary"`
}

// PredictAttrition calculates turnover risk for an employee
func (s *AIHRService) PredictAttrition(employeeID string) (*AttritionPrediction, error) {
	// Mock fetching employee data
	// In reality, this would query the employees table and related performance/attendance tables

	// Simulating data for demonstration
	var employee struct {
		Name            string
		TenureMonths    int
		LastRating      float64 // 1-5
		AvgHoursWorked  float64 // Weekly
		Salary          float64
		Department      string
		CommuteDistance float64 // km
	}

	// Hardcoded simulation based on ID for demo variety
	if strings.HasSuffix(employeeID, "1") {
		employee.Name = "Alice Johnson"
		employee.TenureMonths = 14
		employee.LastRating = 3.2
		employee.AvgHoursWorked = 55
		employee.Salary = 45000
		employee.Department = "Sales"
		employee.CommuteDistance = 25
	} else {
		employee.Name = "Bob Smith"
		employee.TenureMonths = 36
		employee.LastRating = 4.5
		employee.AvgHoursWorked = 40
		employee.Salary = 85000
		employee.Department = "Engineering"
		employee.CommuteDistance = 5
	}

	risk := 0.1 // Base risk
	var factors []string

	// Risk Factor 1: Low Rating
	if employee.LastRating < 3.5 {
		risk += 0.3
		factors = append(factors, "Low Performance Rating")
	}

	// Risk Factor 2: Overworked
	if employee.AvgHoursWorked > 50 {
		risk += 0.25
		factors = append(factors, "High Work Hours (Burnout Risk)")
	}

	// Risk Factor 3: Long Commute
	if employee.CommuteDistance > 20 {
		risk += 0.15
		factors = append(factors, "Long Commute")
	}

	// Risk Factor 4: Tenure "Danger Zone" (12-18 months)
	if employee.TenureMonths >= 12 && employee.TenureMonths <= 18 {
		risk += 0.1
		factors = append(factors, "Critical Tenure Period (1-1.5 years)")
	}

	if risk > 0.9 {
		risk = 0.95
	}

	strategy := "Maintain regular check-ins."
	if risk > 0.7 {
		strategy = "Immediate intervention required. Schedule 1:1 to discuss career path and workload."
	} else if risk > 0.4 {
		strategy = "Monitor workload and offer flexibility."
	}

	return &AttritionPrediction{
		EmployeeID:        employeeID,
		EmployeeName:      employee.Name,
		AttritionRisk:     math.Round(risk*100) / 100,
		RiskFactors:       factors,
		RetentionStrategy: strategy,
	}, nil
}

// ScreenResume scores a resume text against a job description
func (s *AIHRService) ScreenResume(resumeText, jobDescription string) (*ResumeScreening, error) {
	resumeText = strings.ToLower(resumeText)
	jobDescription = strings.ToLower(jobDescription)

	// Extract skills from JD (simple keyword extraction)
	// In a real AI model, this would use NLP to identify entities
	commonSkills := []string{"python", "go", "golang", "react", "javascript", "typescript", "sql", "postgres", "aws", "docker", "kubernetes", "communication", "leadership", "sales", "marketing"}

	var requiredSkills []string
	for _, skill := range commonSkills {
		if strings.Contains(jobDescription, skill) {
			requiredSkills = append(requiredSkills, skill)
		}
	}

	if len(requiredSkills) == 0 {
		requiredSkills = []string{"general"} // Fallback
	}

	var matched []string
	var missing []string
	matchCount := 0

	for _, skill := range requiredSkills {
		if strings.Contains(resumeText, skill) {
			matched = append(matched, skill)
			matchCount++
		} else {
			missing = append(missing, skill)
		}
	}

	score := (float64(matchCount) / float64(len(requiredSkills))) * 100

	// Extract name (heuristic: first line)
	lines := strings.Split(resumeText, "\n")
	name := "Candidate"
	if len(lines) > 0 {
		name = strings.Title(lines[0])
		if len(name) > 30 {
			name = "Candidate"
		}
	}

	summary := "Strong match for the role."
	if score < 50 {
		summary = "Low match. Missing key technical skills."
	} else if score < 80 {
		summary = "Good match, but lacks some specific requirements."
	}

	return &ResumeScreening{
		CandidateName: name,
		MatchScore:    math.Round(score),
		MatchedSkills: matched,
		MissingSkills: missing,
		Summary:       summary,
	}, nil
}
