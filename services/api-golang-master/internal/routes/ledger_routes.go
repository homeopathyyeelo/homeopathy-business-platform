package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/handlers"
	"gorm.io/gorm"
)

// RegisterLedgerRoutes registers all ledger-related routes
func RegisterLedgerRoutes(router *gin.RouterGroup, db *gorm.DB) {
	ledgerHandler := handlers.NewLedgerHandler(db)

	ledger := router.Group("/ledger")
	{
		// Chart of Accounts
		ledger.GET("/accounts", ledgerHandler.GetAccounts)
		ledger.GET("/accounts/:code/balance", ledgerHandler.GetAccountBalance)

		// Journal Entries
		ledger.POST("/journal-entries", ledgerHandler.CreateJournalEntry)

		// Reports
		ledger.GET("/trial-balance", ledgerHandler.GetTrialBalance)
		ledger.GET("/profit-loss", ledgerHandler.GetProfitLoss)
		ledger.GET("/balance-sheet", ledgerHandler.GetBalanceSheet)
		ledger.GET("/general-ledger/:code", ledgerHandler.GetGeneralLedger)
	}
}
