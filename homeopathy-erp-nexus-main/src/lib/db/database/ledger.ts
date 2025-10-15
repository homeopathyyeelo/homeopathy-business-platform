
// Ledger-specific database operations
import { coreDb } from './core';
import { LedgerEntry, PaymentTransaction } from '@/types';

export class LedgerDatabase {
  // Get ledger entries for a customer or supplier
  public async getLedgerEntries(
    entityId: string, 
    type: 'customer' | 'supplier'
  ): Promise<any[]> {
    let entries = [];
    
    if (type === 'customer') {
      // Get all invoices for this customer
      const invoices = await coreDb.query('invoices', { customerId: entityId });
      
      // Convert invoices to ledger entries
      for (const invoice of invoices) {
        entries.push({
          id: `dr_${invoice.id}`,
          date: invoice.date,
          entityId,
          entityType: 'customer',
          transactionType: 'invoice',
          documentNumber: invoice.invoiceNumber,
          description: `Invoice ${invoice.invoiceNumber}`,
          debit: invoice.total,
          credit: 0,
          balance: 0,
          relatedId: invoice.id,
          createdAt: invoice.createdAt
        });
        
        // If payment was received, add a credit entry
        if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'partial') {
          const paidAmount = invoice.paymentStatus === 'paid' ? invoice.total : invoice.total * 0.5;
          entries.push({
            id: `cr_${invoice.id}`,
            date: invoice.updatedAt,
            entityId,
            entityType: 'customer',
            transactionType: 'payment',
            documentNumber: `REC${invoice.invoiceNumber}`,
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            debit: 0,
            credit: paidAmount,
            balance: 0,
            relatedId: invoice.id,
            paymentMethod: invoice.paymentMethod,
            createdAt: invoice.updatedAt
          });
        }
      }
    } else if (type === 'supplier') {
      // Get all purchases for this supplier
      const purchases = await coreDb.query('purchases', { supplierId: entityId });
      
      // Convert purchases to ledger entries
      for (const purchase of purchases) {
        entries.push({
          id: `cr_${purchase.id}`,
          date: purchase.date,
          entityId,
          entityType: 'supplier',
          transactionType: 'purchase',
          documentNumber: purchase.invoiceNumber,
          description: `Purchase ${purchase.invoiceNumber}`,
          debit: 0,
          credit: purchase.total,
          balance: 0,
          relatedId: purchase.id,
          createdAt: purchase.createdAt
        });
        
        // If payment was made, add a debit entry
        if (purchase.paymentStatus === 'paid' || purchase.paymentStatus === 'partial') {
          const paidAmount = purchase.paymentStatus === 'paid' ? purchase.total : purchase.total * 0.5;
          entries.push({
            id: `dr_${purchase.id}`,
            date: purchase.updatedAt,
            entityId,
            entityType: 'supplier',
            transactionType: 'payment',
            documentNumber: `PAY${purchase.invoiceNumber}`,
            description: `Payment for purchase ${purchase.invoiceNumber}`,
            debit: paidAmount,
            credit: 0,
            balance: 0,
            relatedId: purchase.id,
            paymentMethod: purchase.paymentMethod,
            createdAt: purchase.updatedAt
          });
        }
      }
    }
    
    // Sort entries by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate running balance
    let balance = 0;
    for (let i = 0; i < entries.length; i++) {
      balance = balance + entries[i].debit - entries[i].credit;
      entries[i].balance = balance;
    }
    
    return entries;
  }

  // Create a new ledger entry
  public async createLedgerEntry(entry: Partial<LedgerEntry>): Promise<LedgerEntry> {
    const newEntry = {
      ...entry,
      id: entry.id || `le_${Date.now()}`,
      date: entry.date || new Date(),
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as LedgerEntry;
    
    return await coreDb.create('ledgerEntries', newEntry);
  }

  // Get trial balance
  public async getTrialBalance(): Promise<any> {
    // This would typically aggregate all ledger accounts
    // For demo purposes, we'll return simulated data
    return {
      assets: {
        inventory: 250000,
        accountsReceivable: 75000,
        cash: 150000,
        total: 475000
      },
      liabilities: {
        accountsPayable: 125000,
        loans: 50000,
        total: 175000
      },
      equity: {
        capital: 250000,
        retainedEarnings: 50000,
        total: 300000
      }
    };
  }

  // Record a payment transaction
  public async recordPayment(payment: Partial<PaymentTransaction>): Promise<PaymentTransaction> {
    const newPayment = {
      ...payment,
      id: payment.id || `pay_${Date.now()}`,
      transactionNumber: payment.transactionNumber || `TXN${Date.now()}`,
      status: payment.status || 'success',
      date: payment.date || new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    } as PaymentTransaction;
    
    const createdPayment = await coreDb.create('paymentTransactions', newPayment);
    
    // Create corresponding ledger entry
    if (createdPayment.entityType === 'customer') {
      // For customer payments, create a credit entry (reducing their dues)
      await this.createLedgerEntry({
        date: createdPayment.date,
        entityId: createdPayment.entityId,
        entityType: 'customer',
        entityName: createdPayment.entityName,
        transactionType: 'payment',
        documentNumber: createdPayment.transactionNumber,
        description: `Payment received from customer`,
        debit: 0,
        credit: createdPayment.amount,
        paymentMethod: createdPayment.paymentMethod,
        relatedId: createdPayment.id,
        createdBy: createdPayment.createdBy || 'system',
        notes: createdPayment.notes
      });
    } else if (createdPayment.entityType === 'supplier') {
      // For supplier payments, create a debit entry (reducing our dues)
      await this.createLedgerEntry({
        date: createdPayment.date,
        entityId: createdPayment.entityId,
        entityType: 'supplier',
        entityName: createdPayment.entityName,
        transactionType: 'payment',
        documentNumber: createdPayment.transactionNumber,
        description: `Payment made to supplier`,
        debit: createdPayment.amount,
        credit: 0,
        paymentMethod: createdPayment.paymentMethod,
        relatedId: createdPayment.id,
        createdBy: createdPayment.createdBy || 'system',
        notes: createdPayment.notes
      });
    }
    
    return createdPayment;
  }

  // Get outstanding payments for a customer or supplier
  public async getOutstandingPayments(entityId: string, type: 'customer' | 'supplier'): Promise<any[]> {
    let query: Record<string, any> = {};
    
    if (type === 'customer') {
      query = { customerId: entityId, paymentStatus: ['pending', 'partial'] };
      return await coreDb.query('invoices', query);
    } else {
      query = { supplierId: entityId, paymentStatus: ['pending', 'partial'] };
      return await coreDb.query('purchases', query);
    }
  }

  // Generate accounting reports
  public async generateAccountingReports(reportType: string, period: string): Promise<any> {
    // This would typically aggregate data based on report type and period
    // For demo purposes, we'll return simulated data
    
    switch (reportType) {
      case 'profit-loss':
        return {
          reportData: {
            income: {
              sales: 500000,
              otherIncome: 20000,
              total: 520000
            },
            expenses: {
              purchases: 300000,
              salaries: 80000,
              rent: 20000,
              utilities: 10000,
              marketing: 5000,
              miscellaneous: 15000,
              total: 430000
            },
            netProfit: 90000
          },
          summary: {
            title: 'Profit & Loss Report',
            period,
            profitMargin: '17.3%'
          }
        };
        
      case 'balance-sheet':
        return {
          reportData: {
            assets: {
              currentAssets: {
                cash: 150000,
                accountsReceivable: 75000,
                inventory: 250000,
                total: 475000
              },
              fixedAssets: {
                furniture: 50000,
                equipment: 100000,
                vehicles: 200000,
                total: 350000
              },
              totalAssets: 825000
            },
            liabilities: {
              currentLiabilities: {
                accountsPayable: 125000,
                loansShortTerm: 20000,
                total: 145000
              },
              longTermLiabilities: {
                loansLongTerm: 30000,
                total: 30000
              },
              totalLiabilities: 175000
            },
            equity: {
              capital: 250000,
              retainedEarnings: 400000,
              total: 650000
            }
          },
          summary: {
            title: 'Balance Sheet',
            asOf: new Date(),
            totalAssetsLiabilities: 825000
          }
        };
        
      case 'cash-flow':
        return {
          reportData: {
            operatingActivities: {
              netIncome: 90000,
              depreciation: 20000,
              changeInReceivables: -15000,
              changeInInventory: -30000,
              changeInPayables: 25000,
              netCashFromOperating: 90000
            },
            investingActivities: {
              purchaseOfEquipment: -40000,
              saleOfAssets: 10000,
              netCashFromInvesting: -30000
            },
            financingActivities: {
              loanRepayments: -10000,
              dividendsPaid: -20000,
              netCashFromFinancing: -30000
            },
            netChangeInCash: 30000,
            beginningCash: 120000,
            endingCash: 150000
          },
          summary: {
            title: 'Cash Flow Statement',
            period,
            cashFlow: 30000
          }
        };
        
      default:
        return {
          reportData: [],
          summary: {
            title: `${reportType} Report`,
            period,
            message: 'No data available for this report type'
          }
        };
    }
  }
}

export const ledgerDb = new LedgerDatabase();
