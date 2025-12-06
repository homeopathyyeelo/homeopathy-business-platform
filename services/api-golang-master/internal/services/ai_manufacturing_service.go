package services

import (
	"math"
	"time"

	"gorm.io/gorm"
)

type AIManufacturingService struct {
	DB *gorm.DB
}

func NewAIManufacturingService(db *gorm.DB) *AIManufacturingService {
	return &AIManufacturingService{DB: db}
}

type ProductionOptimization struct {
	BatchID             string   `json:"batch_id"`
	ProductName         string   `json:"product_name"`
	OptimalBatchSize    int      `json:"optimal_batch_size"`
	PredictedDuration   int      `json:"predicted_duration_hours"`
	ResourceUtilization float64  `json:"resource_utilization"` // %
	Bottleneck          string   `json:"bottleneck"`
	EfficiencyScore     float64  `json:"efficiency_score"`
	Recommendations     []string `json:"recommendations"`
}

// OptimizeProduction suggests optimizations for a production batch
func (s *AIManufacturingService) OptimizeProduction(productID string, targetQty int) (*ProductionOptimization, error) {
	// Mock product data
	productName := "Arnica Montana 30C" // Default

	// Simulation logic
	// Optimal batch size calculation (EOQ model simulation)
	// Assume setup cost = 500, holding cost = 2, demand = 1000
	optimalSize := int(math.Sqrt((2 * 1000 * 500) / 2))

	// Adjust based on target
	if targetQty > 0 {
		// If target is much larger than optimal, suggest splitting
		if targetQty > optimalSize*2 {
			optimalSize = targetQty / 2
		} else {
			optimalSize = targetQty
		}
	}

	// Predict duration (linear + setup)
	setupTime := 4.0 // hours
	unitTime := 0.05 // hours per unit
	predictedDuration := setupTime + (float64(optimalSize) * unitTime)

	// Identify bottleneck
	bottleneck := "None"
	utilization := 85.0
	efficiency := 0.92
	var recommendations []string

	if optimalSize > 5000 {
		bottleneck = "Packaging Unit"
		utilization = 98.0
		efficiency = 0.85
		recommendations = append(recommendations, "Split batch to reduce packaging bottleneck")
		recommendations = append(recommendations, "Schedule packaging shift overlap")
	} else if optimalSize < 500 {
		bottleneck = "Setup Time"
		utilization = 40.0
		efficiency = 0.60
		recommendations = append(recommendations, "Increase batch size to amortize setup costs")
	} else {
		recommendations = append(recommendations, "Current parameters are optimal")
	}

	// Add random variation for demo
	if time.Now().Unix()%2 == 0 {
		recommendations = append(recommendations, "Check raw material quality - recent variations detected")
	}

	return &ProductionOptimization{
		BatchID:             "BATCH-" + time.Now().Format("20060102"),
		ProductName:         productName,
		OptimalBatchSize:    optimalSize,
		PredictedDuration:   int(predictedDuration),
		ResourceUtilization: utilization,
		Bottleneck:          bottleneck,
		EfficiencyScore:     efficiency,
		Recommendations:     recommendations,
	}, nil
}
