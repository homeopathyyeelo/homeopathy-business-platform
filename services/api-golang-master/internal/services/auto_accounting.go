package services

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// AutoAccountingService handles automatic journal entry creation
type AutoAccountingService struct {
	db            *gorm.DB
	ledgerService *LedgerService
}

// NewAutoAccountingService creates a new auto-accounting service
func NewAutoAccountingService(db *gorm.DB) *AutoAccountingService {
	return &AutoAccountingService{
		db:            db,
		ledgerService: NewLedgerService(db),
	}
}

// Account codes (matched to chart of accounts)
const (
	AccountCashInHand  = "1111"
	AccountBankAccount = "1112"
	AccountUPIGateway  = "1113"
	AccountReceivable  = "1120"
	AccountInventory   = "1130"
	AccountPayable     = "2110"
	AccountCGSTPayable = "2121"
	AccountSGSTPayable = "2122"
	AccountIGSTPayable = "2123"
	AccountPOSSales    = "4110"
	AccountB2BSales    = "4120"
	AccountCOGS        = "5100"
)

// PostInvoiceJournalEntry creates journal entry when invoice is created
func (s *AutoAccountingService) PostInvoiceJournalEntry(invoiceID, invoiceNo string, invoiceDate time.Time, customerName string, subtotal, cgst, sgst, igst, totalAmount float64, invoiceType string) error {
	// Determine sales account based on invoice type
	salesAccount := AccountPOSSales
	if invoiceType == "B2B" || invoiceType == "SALES_ORDER" {
		salesAccount = AccountB2BSales
	}

	// Build journal entry lines
	lines := []JournalEntryLineItem{
		// Debit: Accounts Receivable (or Cash if paid immediately)
		{
			AccountCode:  AccountReceivable,
			DebitAmount:  totalAmount,
			CreditAmount: 0,
			Description:  fmt.Sprintf("Invoice %s - %s", invoiceNo, customerName),
		},
		// Credit: Sales Revenue
		{
			AccountCode:  salesAccount,
			DebitAmount:  0,
			CreditAmount: subtotal,
			Description:  fmt.Sprintf("Sales revenue - Invoice %s", invoiceNo),
		},
	}

	// Add GST lines if applicable
	if cgst > 0 {
		lines = append(lines, JournalEntryLineItem{
			AccountCode:  AccountCGSTPayable,
			DebitAmount:  0,
			CreditAmount: cgst,
			Description:  fmt.Sprintf("CGST on Invoice %s", invoiceNo),
		})
	}

	if sgst > 0 {
		lines = append(lines, JournalEntryLineItem{
			AccountCode:  AccountSGSTPayable,
			DebitAmount:  0,
			CreditAmount: sgst,
			Description:  fmt.Sprintf("SGST on Invoice %s", invoiceNo),
		})
	}

	if igst > 0 {
		lines = append(lines, JournalEntryLineItem{
			AccountCode:  AccountIGSTPayable,
			DebitAmount:  0,
			CreditAmount: igst,
			Description:  fmt.Sprintf("IGST on Invoice %s", invoiceNo),
		})
	}

	// Create journal entry
	req := CreateJournalEntryRequest{
		EntryDate:     invoiceDate,
		ReferenceType: "INVOICE",
		ReferenceID:   invoiceID,
		Description:   fmt.Sprintf("Sales Invoice %s - %s", invoiceNo, customerName),
		CreatedBy:     "AutoAccounting",
		Lines:         lines,
	}

	_, err := s.ledgerService.CreateJournalEntry(req)
	return err
}

// PostPaymentJournalEntry creates journal entry when payment is received
func (s *AutoAccountingService) PostPaymentJournalEntry(paymentID, paymentNo, invoiceNo, customerName, paymentMethod string, paymentDate time.Time, amount float64) error {
	// Determine cash account based on payment method
	cashAccount := AccountCashInHand
	switch paymentMethod {
	case "BANK_TRANSFER", "CHEQUE":
		cashAccount = AccountBankAccount
	case "UPI", "CARD":
		cashAccount = AccountUPIGateway
	}

	// Build journal entry
	lines := []JournalEntryLineItem{
		// Debit: Cash/Bank
		{
			AccountCode:  cashAccount,
			DebitAmount:  amount,
			CreditAmount: 0,
			Description:  fmt.Sprintf("Payment %s - %s (%s)", paymentNo, customerName, paymentMethod),
		},
		// Credit: Accounts Receivable
		{
			AccountCode:  AccountReceivable,
			DebitAmount:  0,
			CreditAmount: amount,
			Description:  fmt.Sprintf("Payment for Invoice %s", invoiceNo),
		},
	}

	req := CreateJournalEntryRequest{
		EntryDate:     paymentDate,
		ReferenceType: "PAYMENT",
		ReferenceID:   paymentID,
		Description:   fmt.Sprintf("Payment Received %s - %s via %s", paymentNo, customerName, paymentMethod),
		CreatedBy:     "AutoAccounting",
		Lines:         lines,
	}

	_, err := s.ledgerService.CreateJournalEntry(req)
	return err
}

// PostPurchaseJournalEntry creates journal entry for purchase
func (s *AutoAccountingService) PostPurchaseJournalEntry(purchaseID, purchaseNo, vendorName string, purchaseDate time.Time, totalAmount, cgst, sgst, igst float64) error {
	subtotal := totalAmount - cgst - sgst - igst

	lines := []JournalEntryLineItem{
		// Debit: Inventory
		{
			AccountCode:  AccountInventory,
			DebitAmount:  subtotal,
			CreditAmount: 0,
			Description:  fmt.Sprintf("Purchase %s - %s", purchaseNo, vendorName),
		},
		// Credit: Accounts Payable
		{
			AccountCode:  AccountPayable,
			DebitAmount:  0,
			CreditAmount: totalAmount,
			Description:  fmt.Sprintf("Purchase from %s", vendorName),
		},
	}

	// Add GST (Input Tax Credit - can be claimed)
	if cgst > 0 {
		lines = append(lines, JournalEntryLineItem{
			AccountCode:  AccountCGSTPayable,
			DebitAmount:  cgst,
			CreditAmount: 0,
			Description:  fmt.Sprintf("CGST on Purchase %s", purchaseNo),
		})
	}

	if sgst > 0 {
		lines = append(lines, JournalEntryLineItem{
			AccountCode:  AccountSGSTPayable,
			DebitAmount:  sgst,
			CreditAmount: 0,
			Description:  fmt.Sprintf("SGST on Purchase %s", purchaseNo),
		})
	}

	if igst > 0 {
		lines = append(lines, JournalEntryLineItem{
			AccountCode:  AccountIGSTPayable,
			DebitAmount:  igst,
			CreditAmount: 0,
			Description:  fmt.Sprintf("IGST on Purchase %s", purchaseNo),
		})
	}

	req := CreateJournalEntryRequest{
		EntryDate:     purchaseDate,
		ReferenceType: "PURCHASE",
		ReferenceID:   purchaseID,
		Description:   fmt.Sprintf("Purchase Order %s - %s", purchaseNo, vendorName),
		CreatedBy:     "AutoAccounting",
		Lines:         lines,
	}

	_, err := s.ledgerService.CreateJournalEntry(req)
	return err
}
