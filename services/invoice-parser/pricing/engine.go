package pricing

import (
	"database/sql"
	"time"
)

type PricingEngine struct {
	db *sql.DB
}

type LineItem struct {
	ProductID    string
	VendorID     string
	BrandID      string
	CategoryID   string
	Qty          float64
	UnitPrice    float64
	TaxRate      float64
	LineDiscount float64
}

type PricingResult struct {
	UnitPrice       float64
	DiscountAmount  float64
	TaxAmount       float64
	LandedUnitCost  float64
	LineTotal       float64
}

func NewPricingEngine(db *sql.DB) *PricingEngine {
	return &PricingEngine{db: db}
}

func (e *PricingEngine) CalculatePrice(item LineItem, freightCharges, otherCharges, totalQty float64) PricingResult {
	result := PricingResult{
		UnitPrice: item.UnitPrice,
	}
	
	// 1. Apply vendor-specific price if exists
	vendorPrice := e.getVendorPrice(item.VendorID, item.ProductID)
	if vendorPrice > 0 {
		result.UnitPrice = vendorPrice
	}
	
	// 2. Calculate line discount
	discount := e.calculateDiscount(item)
	result.DiscountAmount = discount
	
	// 3. Calculate tax
	netPrice := result.UnitPrice - (discount / item.Qty)
	result.TaxAmount = netPrice * (item.TaxRate / 100)
	
	// 4. Calculate landed cost (proportional freight/charges)
	freightPerUnit := (freightCharges + otherCharges) * (item.Qty / totalQty)
	result.LandedUnitCost = netPrice + (freightPerUnit / item.Qty) + result.TaxAmount
	
	// 5. Line total
	result.LineTotal = (netPrice + result.TaxAmount) * item.Qty
	
	return result
}

func (e *PricingEngine) getVendorPrice(vendorID, productID string) float64 {
	var price float64
	err := e.db.QueryRow(`
		SELECT unit_price 
		FROM vendor_price_list
		WHERE vendor_id = $1 
		  AND product_id = $2
		  AND active = true
		  AND effective_from <= $3
		  AND (effective_to IS NULL OR effective_to >= $3)
		ORDER BY effective_from DESC
		LIMIT 1
	`, vendorID, productID, time.Now()).Scan(&price)
	
	if err != nil {
		return 0
	}
	return price
}

func (e *PricingEngine) calculateDiscount(item LineItem) float64 {
	var discount float64
	
	// Check vendor-specific discount
	e.db.QueryRow(`
		SELECT discount_value
		FROM discount_rules
		WHERE scope = 'vendor'
		  AND scope_id = $1
		  AND active = true
		  AND (min_qty IS NULL OR $2 >= min_qty)
		  AND (valid_from IS NULL OR valid_from <= $3)
		  AND (valid_to IS NULL OR valid_to >= $3)
		ORDER BY discount_value DESC
		LIMIT 1
	`, item.VendorID, item.Qty, time.Now()).Scan(&discount)
	
	if discount > 0 {
		return (item.UnitPrice * item.Qty) * (discount / 100)
	}
	
	// Check brand discount
	e.db.QueryRow(`
		SELECT discount_value
		FROM discount_rules
		WHERE scope = 'brand'
		  AND scope_id = $1
		  AND active = true
		  AND (min_qty IS NULL OR $2 >= min_qty)
		ORDER BY discount_value DESC
		LIMIT 1
	`, item.BrandID, item.Qty).Scan(&discount)
	
	if discount > 0 {
		return (item.UnitPrice * item.Qty) * (discount / 100)
	}
	
	// Check category discount
	e.db.QueryRow(`
		SELECT discount_value
		FROM discount_rules
		WHERE scope = 'category'
		  AND scope_id = $1
		  AND active = true
		ORDER BY discount_value DESC
		LIMIT 1
	`, item.CategoryID).Scan(&discount)
	
	if discount > 0 {
		return (item.UnitPrice * item.Qty) * (discount / 100)
	}
	
	return 0
}

func (e *PricingEngine) CalculateInvoiceTotal(lines []LineItem, freightCharges, otherCharges float64) (float64, float64, float64) {
	var subtotal, totalTax, totalDiscount float64
	totalQty := 0.0
	
	for _, line := range lines {
		totalQty += line.Qty
	}
	
	for _, line := range lines {
		result := e.CalculatePrice(line, freightCharges, otherCharges, totalQty)
		subtotal += result.LineTotal
		totalTax += result.TaxAmount * line.Qty
		totalDiscount += result.DiscountAmount
	}
	
	return subtotal, totalTax, totalDiscount
}
