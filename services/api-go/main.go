package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/handlers"
)

// Order represents a sales order
type Order struct {
	ID           string    `json:"id"`
	CustomerID   string    `json:"customer_id"`
	ShopID       string    `json:"shop_id"`
	TotalAmount  float64   `json:"total_amount"`
	Status       string    `json:"status"`
	OrderType    string    `json:"order_type"`
	PaymentStatus string   `json:"payment_status"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Product represents a product
type Product struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	ImageURL    string  `json:"image_url"`
	Category    string  `json:"category"`
	IsActive    bool    `json:"is_active"`
	ShopID      string  `json:"shop_id"`
}

// Customer represents a customer
type Customer struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Phone            string    `json:"phone"`
	Email            string    `json:"email"`
	Address          string    `json:"address"`
	DateOfBirth      time.Time `json:"date_of_birth"`
	Gender           string    `json:"gender"`
	MarketingConsent bool      `json:"marketing_consent"`
	LoyaltyPoints    int       `json:"loyalty_points"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Mock data
var orders = []Order{
	{
		ID:            "1",
		CustomerID:    "1",
		ShopID:        "1",
		TotalAmount:   150.00,
		Status:        "COMPLETED",
		OrderType:     "WALK_IN",
		PaymentStatus: "PAID",
		Notes:         "Regular customer",
		CreatedAt:     time.Now().Add(-24 * time.Hour),
		UpdatedAt:     time.Now().Add(-24 * time.Hour),
	},
	{
		ID:            "2",
		CustomerID:    "2",
		ShopID:        "1",
		TotalAmount:   75.50,
		Status:        "PENDING",
		OrderType:     "ONLINE",
		PaymentStatus: "PENDING",
		Notes:         "First time customer",
		CreatedAt:     time.Now().Add(-2 * time.Hour),
		UpdatedAt:     time.Now().Add(-2 * time.Hour),
	},
}

var products = []Product{
	{
		ID:          "1",
		Name:        "Arnica Montana 30C",
		Description: "Homeopathic remedy for bruises and muscle pain",
		Price:       25.00,
		ImageURL:    "/images/arnica.jpg",
		Category:    "Pain Relief",
		IsActive:    true,
		ShopID:      "1",
	},
	{
		ID:          "2",
		Name:        "Calendula Cream",
		Description: "Natural healing cream for skin irritations",
		Price:       18.50,
		ImageURL:    "/images/calendula.jpg",
		Category:    "Skin Care",
		IsActive:    true,
		ShopID:      "1",
	},
}

var customers = []Customer{
	{
		ID:               "1",
		Name:             "John Doe",
		Phone:            "9876543210",
		Email:            "john@example.com",
		Address:          "123 Main St, City",
		DateOfBirth:      time.Date(1985, 5, 15, 0, 0, 0, 0, time.UTC),
		Gender:           "Male",
		MarketingConsent: true,
		LoyaltyPoints:    150,
		CreatedAt:        time.Now().Add(-30 * 24 * time.Hour),
		UpdatedAt:        time.Now().Add(-30 * 24 * time.Hour),
	},
	{
		ID:               "2",
		Name:             "Jane Smith",
		Phone:            "9876543211",
		Email:            "jane@example.com",
		Address:          "456 Oak Ave, City",
		DateOfBirth:      time.Date(1990, 8, 22, 0, 0, 0, 0, time.UTC),
		Gender:           "Female",
		MarketingConsent: false,
		LoyaltyPoints:    75,
		CreatedAt:        time.Now().Add(-15 * 24 * time.Hour),
		UpdatedAt:        time.Now().Add(-15 * 24 * time.Hour),
	},
}

// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "ok",
		"service":   "orders-api",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Get all orders
func getOrdersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"orders": orders,
		"total":  len(orders),
	})
}

// Get order by ID
func getOrderHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID := vars["id"]

	for _, order := range orders {
		if order.ID == orderID {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(order)
			return
		}
	}

	w.WriteHeader(http.StatusNotFound)
	json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
}

// Create new order
func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	var newOrder Order
	if err := json.NewDecoder(r.Body).Decode(&newOrder); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON"})
		return
	}

	// Generate new ID
	newOrder.ID = strconv.Itoa(len(orders) + 1)
	newOrder.CreatedAt = time.Now()
	newOrder.UpdatedAt = time.Now()

	orders = append(orders, newOrder)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newOrder)
}

// Get all products
func getProductsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"products": products,
		"total":    len(products),
	})
}

// Get all customers
func getCustomersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"customers": customers,
		"total":     len(customers),
	})
}

// Analytics endpoint
func getAnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	// Mock analytics data
	analytics := map[string]interface{}{
		"totalOrders":     len(orders),
		"totalRevenue":    225.50,
		"totalCustomers":  len(customers),
		"totalProducts":   len(products),
		"ordersToday":     2,
		"revenueToday":    225.50,
		"topProducts": []map[string]interface{}{
			{"name": "Arnica Montana 30C", "sales": 5, "revenue": 125.00},
			{"name": "Calendula Cream", "sales": 3, "revenue": 55.50},
		},
		"recentOrders": orders,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(analytics)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	r := mux.NewRouter()

	// Health check
	r.HandleFunc("/health", healthHandler).Methods("GET")

	// Orders API
	r.HandleFunc("/orders", getOrdersHandler).Methods("GET")
	r.HandleFunc("/orders", createOrderHandler).Methods("POST")
	r.HandleFunc("/orders/{id}", getOrderHandler).Methods("GET")

	// Products API
	r.HandleFunc("/products", getProductsHandler).Methods("GET")

	// Customers API
	r.HandleFunc("/customers", getCustomersHandler).Methods("GET")

	// Analytics API
	r.HandleFunc("/analytics", getAnalyticsHandler).Methods("GET")

	// CORS middleware
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3100"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	log.Printf("🚀 Orders API server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler(r)))
}
