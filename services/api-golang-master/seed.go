// =============================================
// COMPREHENSIVE HOMEOPATHY MASTER DATA SEEDING
// =============================================
// Seeds all master data for homeopathy business

package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/gorm"
)

// SeedHomeopathyMasterData seeds all homeopathy-specific master data
func SeedHomeopathyMasterData(db *gorm.DB) error {
	log.Println("Starting homeopathy master data seeding...")

	// Seed in correct order (dependencies first)
	if err := seedCompanies(db); err != nil {
		return fmt.Errorf("failed to seed companies: %w", err)
	}

	if err := seedBranches(db); err != nil {
		return fmt.Errorf("failed to seed branches: %w", err)
	}

	if err := seedDepartments(db); err != nil {
		return fmt.Errorf("failed to seed departments: %w", err)
	}

	if err := seedUsers(db); err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}

	if err := seedCurrencies(db); err != nil {
		return fmt.Errorf("failed to seed currencies: %w", err)
	}

	if err := seedTaxSlabs(db); err != nil {
		return fmt.Errorf("failed to seed tax slabs: %w", err)
	}

	if err := seedUOMs(db); err != nil {
		return fmt.Errorf("failed to seed UOMs: %w", err)
	}

	if err := seedPaymentMethods(db); err != nil {
		return fmt.Errorf("failed to seed payment methods: %w", err)
	}

	if err := seedBrands(db); err != nil {
		return fmt.Errorf("failed to seed brands: %w", err)
	}

	if err := seedCategories(db); err != nil {
		return fmt.Errorf("failed to seed categories: %w", err)
	}

	if err := seedSubcategories(db); err != nil {
		return fmt.Errorf("failed to seed subcategories: %w", err)
	}

	if err := seedPotencies(db); err != nil {
		return fmt.Errorf("failed to seed potencies: %w", err)
	}

	if err := seedSizes(db); err != nil {
		return fmt.Errorf("failed to seed sizes: %w", err)
	}

	if err := seedVariants(db); err != nil {
		return fmt.Errorf("failed to seed variants: %w", err)
	}

	if err := seedGroups(db); err != nil {
		return fmt.Errorf("failed to seed groups: %w", err)
	}

	if err := seedWarehouses(db); err != nil {
		return fmt.Errorf("failed to seed warehouses: %w", err)
	}

	if err := seedRackLocations(db); err != nil {
		return fmt.Errorf("failed to seed rack locations: %w", err)
	}

	if err := seedHSNCodes(db); err != nil {
		return fmt.Errorf("failed to seed HSN codes: %w", err)
	}

	if err := seedPriceLists(db); err != nil {
		return fmt.Errorf("failed to seed price lists: %w", err)
	}

	if err := seedDiscounts(db); err != nil {
		return fmt.Errorf("failed to seed discounts: %w", err)
	}

	if err := seedSalesTypes(db); err != nil {
		return fmt.Errorf("failed to seed sales types: %w", err)
	}

	if err := seedInvoiceSeries(db); err != nil {
		return fmt.Errorf("failed to seed invoice series: %w", err)
	}

	if err := seedVendors(db); err != nil {
		return fmt.Errorf("failed to seed vendors: %w", err)
	}

	if err := seedCustomerGroups(db); err != nil {
		return fmt.Errorf("failed to seed customer groups: %w", err)
	}

	if err := seedRoles(db); err != nil {
		return fmt.Errorf("failed to seed roles: %w", err)
	}

	if err := seedSystemSettings(db); err != nil {
		return fmt.Errorf("failed to seed system settings: %w", err)
	}

	log.Println("Homeopathy master data seeding completed successfully!")
	return nil
}

// ==================== SEEDING FUNCTIONS ====================

func seedCompanies(db *gorm.DB) error {
	companies := []CompanyProfile{
		{
			Name:        "Yeelo Homeopathy",
			Address:     "123 Health Street, Medical District",
			City:        "Mumbai",
			State:       "Maharashtra",
			Pincode:     "400001",
			Country:     "India",
			Phone:       "+91-22-12345678",
			Email:       "info@yeelohomeopathy.com",
			Website:     "https://yeelohomeopathy.com",
			GSTNumber:   "27AABCU1234F1Z5",
			PANNumber:   "AABCU1234F",
			LicenseNumber: "HOM/MH/2024/001",
			LicenseExpiry: &[]time.Time{time.Now().AddDate(5, 0, 0)}[0],
			BusinessType: "Retail",
			IsActive:    true,
		},
	}

	for _, company := range companies {
		if err := db.FirstOrCreate(&company, CompanyProfile{Name: company.Name}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedBranches(db *gorm.DB) error {
	branches := []Branch{
		{
			Code:        "MAIN",
			Name:        "Main Branch",
			Address:     "123 Health Street, Medical District",
			City:        "Mumbai",
			State:       "Maharashtra",
			Pincode:     "400001",
			Country:     "India",
			Phone:       "+91-22-12345678",
			Email:       "main@yeelohomeopathy.com",
			BranchType:  "Main",
			Region:      "Mumbai Central",
			IsHeadOffice: true,
			IsActive:    true,
		},
		{
			Code:        "WH1",
			Name:        "Central Warehouse",
			Address:     "Industrial Area, Plot 45",
			City:        "Mumbai",
			State:       "Maharashtra",
			Pincode:     "400001",
			Country:     "India",
			Phone:       "+91-22-87654321",
			Email:       "warehouse@yeelohomeopathy.com",
			BranchType:  "Warehouse",
			Region:      "Mumbai Industrial",
			IsActive:    true,
		},
	}

	for _, branch := range branches {
		if err := db.FirstOrCreate(&branch, Branch{Code: branch.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedDepartments(db *gorm.DB) error {
	departments := []Department{
		{
			Code:         "SALES",
			Name:         "Sales Department",
			Description:  "Handles customer sales and orders",
			DepartmentType: "Sales",
			IsActive:     true,
		},
		{
			Code:         "INV",
			Name:         "Inventory Management",
			Description:  "Manages stock, purchases, and warehouse",
			DepartmentType: "Inventory",
			IsActive:     true,
		},
		{
			Code:         "HR",
			Name:         "Human Resources",
			Description:  "Employee management and payroll",
			DepartmentType: "HR",
			IsActive:     true,
		},
		{
			Code:         "FIN",
			Name:         "Finance & Accounting",
			Description:  "Financial operations and reporting",
			DepartmentType: "Finance",
			IsActive:     true,
		},
		{
			Code:         "CS",
			Name:         "Customer Service",
			Description:  "Customer support and service",
			DepartmentType: "Customer Service",
			IsActive:     true,
		},
		{
			Code:         "IT",
			Name:         "Information Technology",
			Description:  "System administration and support",
			DepartmentType: "IT",
			IsActive:     true,
		},
		{
			Code:         "QC",
			Name:         "Quality Control",
			Description:  "Product quality testing and compliance",
			DepartmentType: "Quality Control",
			IsActive:     true,
		},
	}

	for _, dept := range departments {
		if err := db.FirstOrCreate(&dept, Department{Code: dept.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedUsers(db *gorm.DB) error {
	// Get departments for foreign key
	var salesDept, invDept, hrDept Department
	if err := db.Where("code = ?", "SALES").First(&salesDept).Error; err != nil {
		return err
	}
	if err := db.Where("code = ?", "INV").First(&invDept).Error; err != nil {
		return err
	}
	if err := db.Where("code = ?", "HR").First(&hrDept).Error; err != nil {
		return err
	}

	// Get branches
	var mainBranch Branch
	if err := db.Where("code = ?", "MAIN").First(&mainBranch).Error; err != nil {
		return err
	}

	users := []User{
		{
			Username:     "admin",
			Email:        "admin@yeelohomeopathy.com",
			Phone:        "+91-9876543210",
			FirstName:    "Admin",
			LastName:     "User",
			Password:     "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			DepartmentID: salesDept.ID,
			BranchID:     mainBranch.ID,
			EmployeeCode: "EMP001",
			IsActive:     true,
		},
		{
			Username:     "manager",
			Email:        "manager@yeelohomeopathy.com",
			Phone:        "+91-9876543211",
			FirstName:    "Store",
			LastName:     "Manager",
			Password:     "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			DepartmentID: salesDept.ID,
			BranchID:     mainBranch.ID,
			EmployeeCode: "EMP002",
			IsActive:     true,
		},
		{
			Username:     "inventory",
			Email:        "inventory@yeelohomeopathy.com",
			Phone:        "+91-9876543212",
			FirstName:    "Inventory",
			LastName:     "Manager",
			Password:     "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
			DepartmentID: invDept.ID,
			BranchID:     mainBranch.ID,
			EmployeeCode: "EMP003",
			IsActive:     true,
		},
	}

	for _, user := range users {
		if err := db.FirstOrCreate(&user, User{Username: user.Username}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedCurrencies(db *gorm.DB) error {
	currencies := []Currency{
		{
			Code:     "INR",
			Name:     "Indian Rupee",
			Symbol:   "₹",
			Rate:     1.0,
			IsBase:   true,
			IsActive: true,
		},
		{
			Code:     "USD",
			Name:     "US Dollar",
			Symbol:   "$",
			Rate:     83.0,
			IsBase:   false,
			IsActive: true,
		},
		{
			Code:     "EUR",
			Name:     "Euro",
			Symbol:   "€",
			Rate:     90.0,
			IsBase:   false,
			IsActive: true,
		},
	}

	for _, currency := range currencies {
		if err := db.FirstOrCreate(&currency, Currency{Code: currency.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedTaxSlabs(db *gorm.DB) error {
	taxSlabs := []TaxSlab{
		{
			Code:        "GST0",
			Name:        "GST 0%",
			Percentage:  0.0,
			Description: "Zero rated goods",
			TaxType:     "GST",
			Category:    "Exempt",
			IsActive:    true,
		},
		{
			Code:        "GST5",
			Name:        "GST 5%",
			Percentage:  5.0,
			Description: "Essential medicines",
			TaxType:     "GST",
			Category:    "Output",
			IsActive:    true,
		},
		{
			Code:        "GST12",
			Name:        "GST 12%",
			Percentage:  12.0,
			Description: "Homeopathy medicines",
			TaxType:     "GST",
			Category:    "Output",
			IsActive:    true,
		},
		{
			Code:        "GST18",
			Name:        "GST 18%",
			Percentage:  18.0,
			Description: "Other goods and services",
			TaxType:     "GST",
			Category:    "Output",
			IsActive:    true,
		},
	}

	for _, tax := range taxSlabs {
		if err := db.FirstOrCreate(&tax, TaxSlab{Code: tax.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedUOMs(db *gorm.DB) error {
	uoms := []UOM{
		{
			Code:        "ML",
			Name:        "Milliliter",
			Description: "Volume measurement for liquids",
			Category:    "Volume",
			ConversionFactor: 1.0,
			IsActive:    true,
		},
		{
			Code:        "L",
			Name:        "Liter",
			Description: "Volume measurement for large liquids",
			Category:    "Volume",
			ConversionFactor: 1000.0,
			IsActive:    true,
		},
		{
			Code:        "GM",
			Name:        "Gram",
			Description: "Weight measurement",
			Category:    "Weight",
			ConversionFactor: 1.0,
			IsActive:    true,
		},
		{
			Code:        "KG",
			Name:        "Kilogram",
			Description: "Weight measurement for large quantities",
			Category:    "Weight",
			ConversionFactor: 1000.0,
			IsActive:    true,
		},
		{
			Code:        "TAB",
			Name:        "Tablets",
			Description: "Tablet count",
			Category:    "Count",
			ConversionFactor: 1.0,
			IsActive:    true,
		},
		{
			Code:        "GLOB",
			Name:        "Globules",
			Description: "Globule count",
			Category:    "Count",
			ConversionFactor: 1.0,
			IsActive:    true,
		},
		{
			Code:        "BOTTLE",
			Name:        "Bottle",
			Description: "Bottle count",
			Category:    "Count",
			ConversionFactor: 1.0,
			IsActive:    true,
		},
		{
			Code:        "STRIP",
			Name:        "Strip",
			Description: "Strip count",
			Category:    "Count",
			ConversionFactor: 1.0,
			IsActive:    true,
		},
	}

	for _, uom := range uoms {
		if err := db.FirstOrCreate(&uom, UOM{Code: uom.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedPaymentMethods(db *gorm.DB) error {
	paymentMethods := []PaymentMethod{
		{
			Code:        "CASH",
			Name:        "Cash",
			Type:        "Cash",
			Description: "Cash payment",
			IsOnline:    false,
			IsActive:    true,
		},
		{
			Code:        "CARD",
			Name:        "Credit/Debit Card",
			Type:        "Card",
			Description: "Card payment",
			ProcessingFee: 2.0,
			IsOnline:    false,
			IsActive:    true,
		},
		{
			Code:        "UPI",
			Name:        "UPI Payment",
			Type:        "UPI",
			Description: "Unified Payments Interface",
			IsOnline:    true,
			IsActive:    true,
		},
		{
			Code:        "NETBANK",
			Name:        "Net Banking",
			Type:        "Net Banking",
			Description: "Online banking transfer",
			ProcessingFee: 1.0,
			IsOnline:    true,
			IsActive:    true,
		},
		{
			Code:        "WALLET",
			Name:        "Digital Wallet",
			Type:        "Wallet",
			Description: "Paytm, PhonePe, etc.",
			ProcessingFee: 1.5,
			IsOnline:    true,
			IsActive:    true,
		},
		{
			Code:        "CHEQUE",
			Name:        "Cheque",
			Type:        "Cheque",
			Description: "Cheque payment",
			IsOnline:    false,
			IsActive:    true,
		},
		{
			Code:        "CREDIT",
			Name:        "Credit",
			Type:        "Credit",
			Description: "Credit payment",
			IsOnline:    false,
			IsActive:    true,
		},
	}

	for _, pm := range paymentMethods {
		if err := db.FirstOrCreate(&pm, PaymentMethod{Code: pm.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedBrands(db *gorm.DB) error {
	brands := []ProductBrand{
		{
			Code:        "DR_RECKEWEG",
			Name:        "Dr. Reckeweg & Co. GmbH",
			Description: "Leading German homeopathy manufacturer",
			Country:     "Germany",
			Website:     "https://www.reckeweg.com",
			IsActive:    true,
		},
		{
			Code:        "SBL",
			Name:        "SBL Private Limited",
			Description: "Indian homeopathy manufacturer",
			Country:     "India",
			Website:     "https://www.sblglobal.com",
			IsActive:    true,
		},
		{
			Code:        "SCHWABE",
			Name:        "Dr. Willmar Schwabe GmbH & Co. KG",
			Description: "German homeopathy manufacturer",
			Country:     "Germany",
			Website:     "https://www.schwabe.com",
			IsActive:    true,
		},
		{
			Code:        "BOIRON",
			Name:        "Boiron",
			Description: "French homeopathy manufacturer",
			Country:     "France",
			Website:     "https://www.boiron.com",
			IsActive:    true,
		},
		{
			Code:        "ALLEN",
			Name:        "Allen Laboratories Ltd.",
			Description: "Indian homeopathy manufacturer",
			Country:     "India",
			IsActive:    true,
		},
		{
			Code:        "WHEEZAL",
			Name:        "Wheezal Laboratories",
			Description: "Indian homeopathy manufacturer",
			Country:     "India",
			IsActive:    true,
		},
	}

	for _, brand := range brands {
		if err := db.FirstOrCreate(&brand, ProductBrand{Code: brand.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedCategories(db *gorm.DB) error {
	categories := []ProductCategory{
		{
			Code:        "MOTHER_TINCTURE",
			Name:        "Mother Tincture",
			Description: "Original tinctures from plant sources",
			IsActive:    true,
		},
		{
			Code:        "BIOCHEMIC",
			Name:        "Biochemic Tablets",
			Description: "Biochemic tissue salts",
			IsActive:    true,
		},
		{
			Code:        "DILUTIONS",
			Name:        "Dilutions",
			Description: "Potentized homeopathic medicines",
			IsActive:    true,
		},
		{
			Code:        "TRITURATION",
			Name:        "Trituration Tablets",
			Description: "Triturated medicines in tablet form",
			IsActive:    true,
		},
		{
			Code:        "GLOBULES",
			Name:        "Medicated Globules",
			Description: "Sugar globules impregnated with medicine",
			IsActive:    true,
		},
		{
			Code:        "DROPS",
			Name:        "Oral Drops",
			Description: "Liquid medicines for oral use",
			IsActive:    true,
		},
		{
			Code:        "OINTMENT",
			Name:        "Ointments & Creams",
			Description: "External application medicines",
			IsActive:    true,
		},
		{
			Code:        "SYRUP",
			Name:        "Syrups",
			Description: "Liquid syrup medicines",
			IsActive:    true,
		},
		{
			Code:        "TABLETS",
			Name:        "Tablets",
			Description: "Compressed tablet medicines",
			IsActive:    true,
		},
	}

	for _, cat := range categories {
		if err := db.FirstOrCreate(&cat, ProductCategory{Code: cat.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedSubcategories(db *gorm.DB) error {
	// Get parent categories
	var motherTincture, dilutions, tablets ProductCategory

	if err := db.Where("code = ?", "MOTHER_TINCTURE").First(&motherTincture).Error; err != nil {
		return err
	}
	if err := db.Where("code = ?", "DILUTIONS").First(&dilutions).Error; err != nil {
		return err
	}
	if err := db.Where("code = ?", "TABLETS").First(&tablets).Error; err != nil {
		return err
	}

	subcategories := []ProductSubcategory{
		{
			Code:        "MT_KIDNEY",
			Name:        "Kidney Care",
			CategoryID:  motherTincture.ID,
			Description: "Mother tinctures for kidney health",
			IsActive:    true,
		},
		{
			Code:        "MT_RESPIRATORY",
			Name:        "Respiratory Care",
			CategoryID:  motherTincture.ID,
			Description: "Mother tinctures for respiratory system",
			IsActive:    true,
		},
		{
			Code:        "MT_DIGESTIVE",
			Name:        "Digestive Care",
			CategoryID:  motherTincture.ID,
			Description: "Mother tinctures for digestive health",
			IsActive:    true,
		},
		{
			Code:        "DIL_ACUTE",
			Name:        "Acute Conditions",
			CategoryID:  dilutions.ID,
			Description: "Dilutions for acute conditions",
			IsActive:    true,
		},
		{
			Code:        "DIL_CHRONIC",
			Name:        "Chronic Conditions",
			CategoryID:  dilutions.ID,
			Description: "Dilutions for chronic conditions",
			IsActive:    true,
		},
		{
			Code:        "TAB_BIOCHEMIC",
			Name:        "Biochemic Tablets",
			CategoryID:  tablets.ID,
			Description: "Biochemic tissue salt tablets",
			IsActive:    true,
		},
	}

	for _, subcat := range subcategories {
		if err := db.FirstOrCreate(&subcat, ProductSubcategory{Code: subcat.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedPotencies(db *gorm.DB) error {
	potencies := []ProductPotency{
		{
			Code:        "Q",
			Name:        "Mother Tincture (Q)",
			Value:       "Q",
			Description: "Original mother tincture",
			IsActive:    true,
		},
		{
			Code:        "6C",
			Name:        "6C Potency",
			Value:       "6C",
			Description: "6th centesimal potency",
			IsActive:    true,
		},
		{
			Code:        "30C",
			Name:        "30C Potency",
			Value:       "30C",
			Description: "30th centesimal potency",
			IsActive:    true,
		},
		{
			Code:        "200C",
			Name:        "200C Potency",
			Value:       "200C",
			Description: "200th centesimal potency",
			IsActive:    true,
		},
		{
			Code:        "1M",
			Name:        "1M Potency",
			Value:       "1M",
			Description: "1000th centesimal potency",
			IsActive:    true,
		},
		{
			Code:        "10M",
			Name:        "10M Potency",
			Value:       "10M",
			Description: "10,000th centesimal potency",
			IsActive:    true,
		},
		{
			Code:        "50M",
			Name:        "50M Potency",
			Value:       "50M",
			Description: "50,000th centesimal potency",
			IsActive:    true,
		},
		{
			Code:        "CM",
			Name:        "CM Potency",
			Value:       "CM",
			Description: "100,000th centesimal potency",
			IsActive:    true,
		},
	}

	for _, potency := range potencies {
		if err := db.FirstOrCreate(&potency, ProductPotency{Code: potency.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedSizes(db *gorm.DB) error {
	sizes := []ProductSize{
		{
			Code:        "10ML",
			Name:        "10ml Bottle",
			Description: "10 milliliter bottle",
			IsActive:    true,
		},
		{
			Code:        "30ML",
			Name:        "30ml Bottle",
			Description: "30 milliliter bottle",
			IsActive:    true,
		},
		{
			Code:        "100ML",
			Name:        "100ml Bottle",
			Description: "100 milliliter bottle",
			IsActive:    true,
		},
		{
			Code:        "500ML",
			Name:        "500ml Bottle",
			Description: "500 milliliter bottle",
			IsActive:    true,
		},
		{
			Code:        "10G",
			Name:        "10g Tube",
			Description: "10 gram tube",
			IsActive:    true,
		},
		{
			Code:        "25G",
			Name:        "25g Tube",
			Description: "25 gram tube",
			IsActive:    true,
		},
		{
			Code:        "450G",
			Name:        "450g Jar",
			Description: "450 gram jar",
			IsActive:    true,
		},
		{
			Code:        "10TAB",
			Name:        "10 Tablets",
			Description: "Pack of 10 tablets",
			IsActive:    true,
		},
		{
			Code:        "25TAB",
			Name:        "25 Tablets",
			Description: "Pack of 25 tablets",
			IsActive:    true,
		},
		{
			Code:        "100TAB",
			Name:        "100 Tablets",
			Description: "Pack of 100 tablets",
			IsActive:    true,
		},
	}

	for _, size := range sizes {
		if err := db.FirstOrCreate(&size, ProductSize{Code: size.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedVariants(db *gorm.DB) error {
	variants := []ProductVariant{
		{
			Code:        "LIQUID",
			Name:        "Liquid",
			Description: "Liquid form medicine",
			IsActive:    true,
		},
		{
			Code:        "TABLET",
			Name:        "Tablet",
			Description: "Tablet form medicine",
			IsActive:    true,
		},
		{
			Code:        "GLOBULE",
			Name:        "Globule",
			Description: "Globule form medicine",
			IsActive:    true,
		},
		{
			Code:        "OINTMENT",
			Name:        "Ointment",
			Description: "Ointment/Cream form",
			IsActive:    true,
		},
		{
			Code:        "DROPS",
			Name:        "Drops",
			Description: "Oral drops",
			IsActive:    true,
		},
		{
			Code:        "SYRUP",
			Name:        "Syrup",
			Description: "Syrup form",
			IsActive:    true,
		},
	}

	for _, variant := range variants {
		if err := db.FirstOrCreate(&variant, ProductVariant{Code: variant.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedGroups(db *gorm.DB) error {
	groups := []ProductGroup{
		{
			Code:        "ACUTE",
			Name:        "Acute Conditions",
			Description: "Medicines for acute conditions",
			IsActive:    true,
		},
		{
			Code:        "CHRONIC",
			Name:        "Chronic Conditions",
			Description: "Medicines for chronic conditions",
			IsActive:    true,
		},
		{
			Code:        "CHILDREN",
			Name:        "Children's Medicines",
			Description: "Pediatric medicines",
			IsActive:    true,
		},
		{
			Code:        "WOMEN",
			Name:        "Women's Health",
			Description: "Gynecological medicines",
			IsActive:    true,
		},
		{
			Code:        "GERIATRIC",
			Name:        "Geriatric Care",
			Description: "Elderly care medicines",
			IsActive:    true,
		},
	}

	for _, group := range groups {
		if err := db.FirstOrCreate(&group, ProductGroup{Code: group.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedWarehouses(db *gorm.DB) error {
	warehouses := []Warehouse{
		{
			Code:        "WH_MAIN",
			Name:        "Main Warehouse",
			Address:     "Industrial Area, Plot 45",
			City:        "Mumbai",
			State:       "Maharashtra",
			Pincode:     "400001",
			Phone:       "+91-22-87654321",
			Capacity:    10000,
			IsActive:    true,
		},
		{
			Code:        "WH_COLD",
			Name:        "Cold Storage",
			Address:     "Temperature Controlled Facility",
			City:        "Mumbai",
			State:       "Maharashtra",
			Pincode:     "400001",
			Phone:       "+91-22-87654322",
			Capacity:    5000,
			IsActive:    true,
		},
	}

	for _, wh := range warehouses {
		if err := db.FirstOrCreate(&wh, Warehouse{Code: wh.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedRackLocations(db *gorm.DB) error {
	// Get warehouse
	var mainWH Warehouse
	if err := db.Where("code = ?", "WH_MAIN").First(&mainWH).Error; err != nil {
		return err
	}

	locations := []RackLocation{
		{
			Code:        "RACK_A1",
			Name:        "Rack A1 - Mother Tinctures",
			WarehouseID: mainWH.ID,
			Description: "First rack for mother tinctures",
			IsActive:    true,
		},
		{
			Code:        "RACK_A2",
			Name:        "Rack A2 - Dilutions",
			WarehouseID: mainWH.ID,
			Description: "Second rack for dilutions",
			IsActive:    true,
		},
		{
			Code:        "RACK_B1",
			Name:        "Rack B1 - Tablets",
			WarehouseID: mainWH.ID,
			Description: "First rack for tablets",
			IsActive:    true,
		},
		{
			Code:        "RACK_B2",
			Name:        "Rack B2 - Ointments",
			WarehouseID: mainWH.ID,
			Description: "Second rack for ointments",
			IsActive:    true,
		},
		{
			Code:        "RACK_C1",
			Name:        "Rack C1 - Syrups",
			WarehouseID: mainWH.ID,
			Description: "First rack for syrups",
			IsActive:    true,
		},
	}

	for _, loc := range locations {
		if err := db.FirstOrCreate(&loc, RackLocation{Code: loc.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedHSNCodes(db *gorm.DB) error {
	hsnCodes := []HSNCode{
		{
			Code:        "30049011",
			Description: "Homoeopathic medicines",
			Chapter:     "30",
			Heading:     "3004",
			IsActive:    true,
		},
		{
			Code:        "30049014",
			Description: "Ayurvedic medicines",
			Chapter:     "30",
			Heading:     "3004",
			IsActive:    true,
		},
	}

	for _, hsn := range hsnCodes {
		if err := db.FirstOrCreate(&hsn, HSNCode{Code: hsn.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedPriceLists(db *gorm.DB) error {
	// Get currency
	var inr Currency
	if err := db.Where("code = ?", "INR").First(&inr).Error; err != nil {
		return err
	}

	priceLists := []PriceList{
		{
			Code:         "MRP",
			Name:         "Maximum Retail Price",
			Description:  "Standard retail price list",
			Type:         "Sale",
			CurrencyID:   inr.ID,
			IsActive:     true,
		},
		{
			Code:         "WHOLESALE",
			Name:         "Wholesale Price",
			Description:  "Price for wholesale customers",
			Type:         "Sale",
			CurrencyID:   inr.ID,
			IsActive:     true,
		},
		{
			Code:         "PURCHASE",
			Name:         "Purchase Price",
			Description:  "Price paid to vendors",
			Type:         "Purchase",
			CurrencyID:   inr.ID,
			IsActive:     true,
		},
	}

	for _, pl := range priceLists {
		if err := db.FirstOrCreate(&pl, PriceList{Code: pl.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedDiscounts(db *gorm.DB) error {
	discounts := []Discount{
		{
			Code:        "STUDENT",
			Name:        "Student Discount",
			Description: "10% discount for students",
			Type:        "Percentage",
			Value:       10.0,
			MinAmount:   100.0,
			IsActive:    true,
		},
		{
			Code:        "SENIOR",
			Name:        "Senior Citizen Discount",
			Description: "15% discount for senior citizens",
			Type:        "Percentage",
			Value:       15.0,
			MinAmount:   200.0,
			IsActive:    true,
		},
		{
			Code:        "BULK",
			Name:        "Bulk Purchase Discount",
			Description: "5% discount for orders above ₹5000",
			Type:        "Percentage",
			Value:       5.0,
			MinAmount:   5000.0,
			IsActive:    true,
		},
	}

	for _, disc := range discounts {
		if err := db.FirstOrCreate(&disc, Discount{Code: disc.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedSalesTypes(db *gorm.DB) error {
	salesTypes := []SalesType{
		{
			Code:        "RETAIL",
			Name:        "Retail Sale",
			Description: "Sale to individual customers",
			IsRetail:    true,
			IsActive:    true,
		},
		{
			Code:        "WHOLESALE",
			Name:        "Wholesale Sale",
			Description: "Sale to wholesale customers",
			IsWholesale: true,
			IsActive:    true,
		},
		{
			Code:        "D2D",
			Name:        "Door to Door",
			Description: "Direct to customer sales",
			IsActive:    true,
		},
		{
			Code:        "ONLINE",
			Name:        "Online Sale",
			Description: "E-commerce sales",
			IsOnline:    true,
			IsActive:    true,
		},
	}

	for _, st := range salesTypes {
		if err := db.FirstOrCreate(&st, SalesType{Code: st.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedInvoiceSeries(db *gorm.DB) error {
	// Get branches
	var mainBranch Branch
	if err := db.Where("code = ?", "MAIN").First(&mainBranch).Error; err != nil {
		return err
	}

	// Get sales types
	var retail, wholesale SalesType
	if err := db.Where("code = ?", "RETAIL").First(&retail).Error; err != nil {
		return err
	}
	if err := db.Where("code = ?", "WHOLESALE").First(&wholesale).Error; err != nil {
		return err
	}

	series := []InvoiceSeries{
		{
			Code:         "INV",
			Name:         "Retail Invoice",
			Prefix:       "INV",
			StartNumber:  1,
			CurrentNumber: 1,
			EndNumber:    999999,
			SalesTypeID:  retail.ID,
			BranchID:     mainBranch.ID,
			IsActive:     true,
		},
		{
			Code:         "WSINV",
			Name:         "Wholesale Invoice",
			Prefix:       "WS",
			StartNumber:  1,
			CurrentNumber: 1,
			EndNumber:    999999,
			SalesTypeID:  wholesale.ID,
			BranchID:     mainBranch.ID,
			IsActive:     true,
		},
		{
			Code:         "RTN",
			Name:         "Return Invoice",
			Prefix:       "RTN",
			StartNumber:  1,
			CurrentNumber: 1,
			EndNumber:    999999,
			SalesTypeID:  retail.ID,
			BranchID:     mainBranch.ID,
			IsActive:     true,
		},
	}

	for _, s := range series {
		if err := db.FirstOrCreate(&s, InvoiceSeries{Code: s.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedVendors(db *gorm.DB) error {
	vendors := []Vendor{
		{
			Code:          "DR_RECKEWEG",
			Name:          "Dr. Reckeweg & Co. GmbH",
			Type:          "Manufacturer",
			ContactPerson: "Dr. Hans Reckeweg",
			Phone:         "+49-40-12345678",
			Email:         "info@reckeweg.de",
			Address:       "Berliner Allee 45, Hamburg, Germany",
			City:          "Hamburg",
			State:         "Hamburg",
			Country:       "Germany",
			GSTNumber:     "DE123456789",
			PaymentTerms:  60,
			CreditLimit:   500000.0,
			IsActive:      true,
		},
		{
			Code:          "SBL_INDIA",
			Name:          "SBL Private Limited",
			Type:          "Manufacturer",
			ContactPerson: "Dr. V.K. Gupta",
			Phone:         "+91-11-45678901",
			Email:         "info@sblglobal.com",
			Address:       "Plot 12, Sector 25, Faridabad, Haryana",
			City:          "Faridabad",
			State:         "Haryana",
			Pincode:       "121004",
			GSTNumber:     "06AABCS1234F1Z5",
			PaymentTerms:  30,
			CreditLimit:   100000.0,
			IsActive:      true,
		},
		{
			Code:          "ALLEN_LABS",
			Name:          "Allen Laboratories Ltd.",
			Type:          "Manufacturer",
			ContactPerson: "Dr. Allen",
			Phone:         "+91-33-23456789",
			Email:         "info@allenlabs.com",
			Address:       "45 Industrial Area, Kolkata, West Bengal",
			City:          "Kolkata",
			State:         "West Bengal",
			Pincode:       "700001",
			GSTNumber:     "19AABCA1234F1Z5",
			PaymentTerms:  45,
			CreditLimit:   75000.0,
			IsActive:      true,
		},
	}

	for _, vendor := range vendors {
		if err := db.FirstOrCreate(&vendor, Vendor{Code: vendor.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedCustomerGroups(db *gorm.DB) error {
	groups := []CustomerGroup{
		{
			Code:            "B2B",
			Name:            "Business to Business",
			Description:     "Wholesale and business customers",
			DiscountPercent: 10.0,
			IsActive:        true,
		},
		{
			Code:            "B2C",
			Name:            "Business to Consumer",
			Description:     "Individual retail customers",
			DiscountPercent: 0.0,
			IsActive:        true,
		},
		{
			Code:            "VIP",
			Name:            "VIP Customers",
			Description:     "High-value customers",
			DiscountPercent: 15.0,
			IsActive:        true,
		},
		{
			Code:            "STAFF",
			Name:            "Staff Members",
			Description:     "Internal staff purchases",
			DiscountPercent: 20.0,
			IsActive:        true,
		},
	}

	for _, group := range groups {
		if err := db.FirstOrCreate(&group, CustomerGroup{Code: group.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedRoles(db *gorm.DB) error {
	roles := []Role{
		{
			Code:        "SUPER_ADMIN",
			Name:        "Super Administrator",
			Description: "Full system access",
			Permissions: []Permission{
				{Code: "SYSTEM_ALL", Name: "All System Access", Module: "system", Action: "all"},
				{Code: "USER_ALL", Name: "All User Management", Module: "users", Action: "all"},
				{Code: "PRODUCT_ALL", Name: "All Product Management", Module: "products", Action: "all"},
			},
			IsSystemRole: true,
			IsActive:     true,
		},
		{
			Code:        "STORE_MANAGER",
			Name:        "Store Manager",
			Description: "Store operations management",
			Permissions: []Permission{
				{Code: "SALES_READ", Name: "View Sales", Module: "sales", Action: "read"},
				{Code: "SALES_CREATE", Name: "Create Sales", Module: "sales", Action: "create"},
				{Code: "INVENTORY_READ", Name: "View Inventory", Module: "inventory", Action: "read"},
				{Code: "INVENTORY_UPDATE", Name: "Update Inventory", Module: "inventory", Action: "update"},
			},
			IsActive:     true,
		},
		{
			Code:        "SALES_EXECUTIVE",
			Name:        "Sales Executive",
			Description: "Sales operations",
			Permissions: []Permission{
				{Code: "SALES_READ", Name: "View Sales", Module: "sales", Action: "read"},
				{Code: "SALES_CREATE", Name: "Create Sales", Module: "sales", Action: "create"},
				{Code: "CUSTOMER_READ", Name: "View Customers", Module: "customers", Action: "read"},
			},
			IsActive:     true,
		},
		{
			Code:        "INVENTORY_MANAGER",
			Name:        "Inventory Manager",
			Description: "Inventory and stock management",
			Permissions: []Permission{
				{Code: "INVENTORY_ALL", Name: "All Inventory Operations", Module: "inventory", Action: "all"},
				{Code: "PURCHASE_READ", Name: "View Purchases", Module: "purchases", Action: "read"},
				{Code: "PURCHASE_CREATE", Name: "Create Purchases", Module: "purchases", Action: "create"},
			},
			IsActive:     true,
		},
	}

	for _, role := range roles {
		if err := db.FirstOrCreate(&role, Role{Code: role.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedSystemSettings(db *gorm.DB) error {
	settings := []SystemSetting{
		{
			Key:         "DEFAULT_CURRENCY",
			Value:       "INR",
			Description: "Default currency for the system",
			Type:        "string",
			Category:    "General",
			IsSystem:    true,
		},
		{
			Key:         "DEFAULT_TAX_SLAB",
			Value:       "GST12",
			Description: "Default tax slab for products",
			Type:        "string",
			Category:    "Taxation",
			IsSystem:    true,
		},
		{
			Key:         "INVENTORY_LOW_STOCK_ALERT",
			Value:       "10",
			Description: "Alert when stock goes below this level",
			Type:        "number",
			Category:    "Inventory",
			IsSystem:    true,
		},
		{
			Key:         "SALES_DISCOUNT_LIMIT",
			Value:       "20",
			Description: "Maximum discount percentage allowed",
			Type:        "number",
			Category:    "Sales",
			IsSystem:    true,
		},
		{
			Key:         "BACKUP_FREQUENCY",
			Value:       "daily",
			Description: "Backup frequency",
			Type:        "string",
			Category:    "Backup",
			IsSystem:    true,
		},
	}

	for _, setting := range settings {
		if err := db.FirstOrCreate(&setting, SystemSetting{Key: setting.Key}).Error; err != nil {
			return err
		}
	}

	return nil
}
