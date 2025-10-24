package services

import (
	"time"
	"gorm.io/gorm"
)

type CustomerCreateDTO struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Type       string `json:"type"`
	GSTNumber  string `json:"gst_number"`
	Address    string `json:"address"`
	Notes      string `json:"notes"`
	ShopID     string `json:"shop_id"`
}

type Customer struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Email      *string   `json:"email"`
	Phone      *string   `json:"phone"`
	Type       *string   `json:"type"`
	GSTNumber  *string   `json:"gst_number"`
	Address    *string   `json:"address"`
	Notes      *string   `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
}

type CustomerService struct{ DB *gorm.DB }

func NewCustomerService(db *gorm.DB) *CustomerService { return &CustomerService{DB: db} }

func (s *CustomerService) Create(dto CustomerCreateDTO) (*Customer, error) {
	// Insert into core.customers if schema exists; fallback to public.customers
	var customer Customer
	query := `
	INSERT INTO core.customers (name, email, phone, customer_type, gst_number, address, notes, created_at)
	VALUES (?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), now())
	RETURNING id, name, email, phone, customer_type as type, gst_number, address, notes, created_at;
	`
	if err := s.DB.Raw(query, dto.Name, dto.Email, dto.Phone, dto.Type, dto.GSTNumber, dto.Address, dto.Notes).Scan(&customer).Error; err != nil {
		// try public.customers
		query2 := `
		INSERT INTO customers (name, email, phone, customer_type, gst_number, address, notes, created_at)
		VALUES (?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), now())
		RETURNING id, name, email, phone, customer_type as type, gst_number, address, notes, created_at;
		`
		if err2 := s.DB.Raw(query2, dto.Name, dto.Email, dto.Phone, dto.Type, dto.GSTNumber, dto.Address, dto.Notes).Scan(&customer).Error; err2 != nil {
			return nil, err2
		}
	}
	return &customer, nil
}
