package main

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

// APITestEndpoint represents an API endpoint to test
type APITestEndpoint struct {
	Path        string
	Method      string
	Description string
	Expected    int
}

// APIConnectivityTester tests all API endpoints for connectivity
func APIConnectivityTester() {
	fmt.Println("🔗 API CONNECTIVITY TESTING")
	fmt.Println("===========================")

	baseURL := "http://localhost:3005" // Adjust if needed

	endpoints := []APITestEndpoint{
		// Health check
		{"/health", "GET", "Health Check", 200},

		// System
		{"/api/v1/system/health", "GET", "System Health", 200},
		{"/api/v1/system/info", "GET", "System Info", 200},

		// ERP routes
		{"/api/erp/products", "GET", "Products List", 200},
		{"/api/erp/categories", "GET", "Categories List", 200},
		{"/api/erp/brands", "GET", "Brands List", 200},
		{"/api/erp/potencies", "GET", "Potencies List", 200},
		{"/api/erp/forms", "GET", "Forms List", 200},
		{"/api/erp/units", "GET", "Units List", 200},
		{"/api/erp/hsn-codes", "GET", "HSN Codes List", 200},

		// Inventory
		{"/api/erp/inventory/stock", "GET", "Inventory Stock", 200},
		{"/api/erp/inventory/alerts/low-stock", "GET", "Low Stock Alerts", 200},
		{"/api/erp/inventory/alerts/expiry", "GET", "Expiry Alerts", 200},

		// Purchases
		{"/api/erp/purchases", "GET", "Purchase Orders", 200},
		{"/api/erp/purchases/pending", "GET", "Pending Purchases", 200},

		// Master data (frontend compatibility)
		{"/api/masters/categories", "GET", "Master Categories", 200},
		{"/api/masters/brands", "GET", "Master Brands", 200},
		{"/api/masters/potencies", "GET", "Master Potencies", 200},

		// Product batches
		{"/api/products/batches", "GET", "Product Batches", 200},
	}

	fmt.Printf("📊 Testing %d API endpoints...\n\n", len(endpoints))

	passed := 0
	failed := 0
	issues := []string{}

	for i, endpoint := range endpoints {
		fmt.Printf("🔍 [%d/%d] Testing %s %s - %s\n",
			i+1, len(endpoints), endpoint.Method, endpoint.Path, endpoint.Description)

		status, err := testEndpoint(baseURL+endpoint.Path, endpoint.Method, endpoint.Expected)

		if err != nil || status != endpoint.Expected {
			if err != nil {
				fmt.Printf("   ❌ FAILED: %v\n", err)
				issues = append(issues, fmt.Sprintf("%s %s - %v", endpoint.Method, endpoint.Path, err))
			} else {
				fmt.Printf("   ❌ FAILED: Expected %d, got %d\n", endpoint.Expected, status)
				issues = append(issues, fmt.Sprintf("%s %s - Expected %d, got %d", endpoint.Method, endpoint.Path, endpoint.Expected, status))
			}
			failed++
		} else {
			fmt.Printf("   ✅ PASSED: %d\n", status)
			passed++
		}
	}

	// Summary
	fmt.Println("\n" + strings.Repeat("=", 50))
	fmt.Println("📊 API CONNECTIVITY TEST RESULTS:")
	fmt.Printf("Total endpoints: %d\n", len(endpoints))
	fmt.Printf("Passed: %d\n", passed)
	fmt.Printf("Failed: %d\n", failed)
	fmt.Printf("Success rate: %.1f%%\n", float64(passed)/float64(len(endpoints))*100)

	if len(issues) > 0 {
		fmt.Println("\n❌ ISSUES FOUND:")
		for _, issue := range issues {
			fmt.Printf("   - %s\n", issue)
		}
	}

	if failed == 0 {
		fmt.Println("\n🎉 ALL API ENDPOINTS WORKING!")
	} else {
		fmt.Println("\n⚠️  SOME API ENDPOINTS HAVE ISSUES!")
		fmt.Println("🔧 Need to fix connectivity issues")
	}
}

func testEndpoint(url, method string, expectedStatus int) (int, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return 0, err
	}

	// Add common headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "HomeoERP-Connectivity-Test")

	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	return resp.StatusCode, nil
}

func main() {
	fmt.Println("🚀 Starting API Connectivity Testing...")
	APIConnectivityTester()
}
