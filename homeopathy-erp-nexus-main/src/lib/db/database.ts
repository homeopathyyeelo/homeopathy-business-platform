
// Main database file that combines core and specialized operations
import { 
  coreDb, 
  purchaseOrderDb, 
  reportDb, 
  userDb, 
  notificationDb, 
  migrationDb 
} from './database/core';

import { inventoryDb } from './database/inventory';
import { gstDb } from './database/gst';
import { ledgerDb } from './database/ledger';

// Combine all database functionality into one export
export const db = {
  // Core database operations
  getAll: coreDb.getAll.bind(coreDb),
  getById: coreDb.getById.bind(coreDb),
  create: coreDb.create.bind(coreDb),
  update: coreDb.update.bind(coreDb),
  delete: coreDb.delete.bind(coreDb),
  query: coreDb.query.bind(coreDb),
  
  // Inventory-specific operations
  updateInventory: inventoryDb.updateInventory.bind(inventoryDb),
  createBatch: inventoryDb.createBatch.bind(inventoryDb),
  getBatchesByProduct: inventoryDb.getBatchesByProduct.bind(inventoryDb),
  updateBatch: inventoryDb.updateBatch.bind(inventoryDb),
  getLowStockItems: inventoryDb.getLowStockItems.bind(inventoryDb),
  getSoonToExpireItems: inventoryDb.getSoonToExpireItems.bind(inventoryDb),
  getProductsByLocation: inventoryDb.getProductsByLocation.bind(inventoryDb),
  createStockMovement: inventoryDb.createStockMovement.bind(inventoryDb),
  getStockMovementLogs: inventoryDb.getStockMovementLogs.bind(inventoryDb),
  transferStock: inventoryDb.transferStock.bind(inventoryDb),

  // GST and Invoice operations
  generateEInvoice: gstDb.generateEInvoice.bind(gstDb),
  generateEWayBill: gstDb.generateEWayBill.bind(gstDb),
  getGSTReturns: gstDb.getGSTReturns.bind(gstDb),
  
  // Ledger operations
  getLedgerEntries: ledgerDb.getLedgerEntries.bind(ledgerDb),
  createLedgerEntry: ledgerDb.createLedgerEntry.bind(ledgerDb),
  getTrialBalance: ledgerDb.getTrialBalance.bind(ledgerDb),
  recordPayment: ledgerDb.recordPayment.bind(ledgerDb),
  getOutstandingPayments: ledgerDb.getOutstandingPayments.bind(ledgerDb),
  generateAccountingReports: ledgerDb.generateAccountingReports.bind(ledgerDb),

  // Purchase order operations
  createPurchaseOrder: purchaseOrderDb.createPurchaseOrder.bind(purchaseOrderDb),
  updatePurchaseOrderStatus: purchaseOrderDb.updatePurchaseOrderStatus.bind(purchaseOrderDb),
  convertPOToPurchase: purchaseOrderDb.convertPOToPurchase.bind(purchaseOrderDb),

  // Report generation
  generateReport: reportDb.generateReport.bind(reportDb),
  saveReport: reportDb.saveReport.bind(reportDb),

  // User and role management
  authenticateUser: userDb.authenticateUser.bind(userDb),
  getUserByRole: userDb.getUserByRole.bind(userDb),
  updateUserRole: userDb.updateUserRole.bind(userDb),

  // Notification system
  createNotification: notificationDb.createNotification.bind(notificationDb),
  getNotificationsForUser: notificationDb.getNotificationsForUser.bind(notificationDb),
  markNotificationAsRead: notificationDb.markNotificationAsRead.bind(notificationDb),

  // Data migration and Supabase-specific methods
  migrateToSupabase: migrationDb.migrateToSupabase.bind(migrationDb),
  exportData: migrationDb.exportData.bind(migrationDb)
};
