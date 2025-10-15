"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSalesReports, usePurchaseReports, useInventoryReports, useGSTReports, useFinancialReports, exportSalesReport, exportPurchaseReport, exportInventoryReport, exportGSTReport, exportFinancialReport } from "@/lib/hooks/reports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, TrendingUp, Package, Receipt, Calculator, Users, Truck, BarChart3 } from "lucide-react";

// Importing existing components to maintain functionality
import { useReportData } from "@/hooks/useReportData";
import ReportHeader from "@/components/reports/ReportHeader";
import ReportSummaryCards from "@/components/reports/ReportSummaryCards";
import ReportTypeSelector from "@/components/reports/ReportTypeSelector";
import ReportDateFilter from "@/components/reports/ReportDateFilter";
import SalesReport from "@/components/reports/SalesReport";
import InventoryReport from "@/components/reports/InventoryReport";
import PurchaseReport from "@/components/reports/PurchaseReport";
import CustomerReport from "@/components/reports/CustomerReport";
import ExpiryReport from "@/components/reports/ExpiryReport";

export default function ReportsPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("sales");
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [selectedPeriodType, setSelectedPeriodType] = useState("monthly");

  // Use new React Query hooks for enhanced functionality
  const { data: salesReports = [] } = useSalesReports({ period: selectedPeriod, period_type: selectedPeriodType as any });
  const { data: purchaseReports = [] } = usePurchaseReports({ period: selectedPeriod, period_type: selectedPeriodType as any });
  const { data: inventoryReports = [] } = useInventoryReports({ as_of_date: selectedPeriod });
  const { data: gstReports = [] } = useGSTReports({ period: selectedPeriod, period_type: selectedPeriodType as any });
  const { data: financialReports = [] } = useFinancialReports({ period: selectedPeriod, period_type: selectedPeriodType as any });

  // Use existing component data for backward compatibility
  const {
    reportType,
    setReportType,
    dateRange,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    handleDateRangeChange,
    filteredInvoices,
    filteredPurchases,
    inventory,
    products,
    customers,
    isLoading,
    totalSales,
    totalPurchases,
    totalProfit,
    exportReport
  } = useReportData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = async (reportType: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    try {
      let exportFunction
      const filters = { period: selectedPeriod, period_type: selectedPeriodType }

      switch (reportType) {
        case 'sales':
          exportFunction = exportSalesReport
          break
        case 'purchases':
          exportFunction = exportPurchaseReport
          break
        case 'inventory':
          exportFunction = exportInventoryReport
          break
        case 'gst':
          exportFunction = exportGSTReport
          break
        case 'financial':
          exportFunction = exportFinancialReport
          break
        default:
          throw new Error('Invalid report type')
      }

      const response = await exportFunction({ ...filters, format })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}_report.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export failed:', error)
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Export Options */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive business reports with export capabilities</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriodType} onValueChange={setSelectedPeriodType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Summary Cards with React Query Data */}
      <ReportSummaryCards
        totalSales={totalSales}
        totalPurchases={totalPurchases}
        totalProfit={totalProfit}
      />

      {/* Tabs for different report categories */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
          <TabsTrigger value="purchases">Purchase Reports</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
          <TabsTrigger value="gst">GST Reports</TabsTrigger>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Sales Reports
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('sales', 'pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('sales', 'excel')}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SalesReport
                invoices={filteredInvoices}
                customers={customers}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Purchase Reports
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('purchases', 'pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('purchases', 'excel')}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PurchaseReport
                purchases={filteredPurchases}
                startDate={startDate}
                endDate={endDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Inventory Reports
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('inventory', 'pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('inventory', 'excel')}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <InventoryReport
                inventory={inventory}
                products={products}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  GST Reports
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('gst', 'pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('gst', 'excel')}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {gstReports.length > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">GST Collected</div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(gstReports[0].total_gst_collected)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">GST Paid</div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(gstReports[0].total_gst_paid)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Net GST</div>
                      <div className={`text-2xl font-bold ${gstReports[0].net_gst >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(gstReports[0].net_gst)}
                      </div>
                    </div>
                  </div>

                  {/* GST by Rate */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">GST Breakdown by Rate</h3>
                    <div className="space-y-2">
                      {gstReports[0].gst_by_rate.map((rate) => (
                        <div key={rate.rate} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium">{rate.rate}% GST</span>
                          <div className="text-right">
                            <p className="text-sm">Collected: {formatCurrency(rate.collected)}</p>
                            <p className="text-sm">Paid: {formatCurrency(rate.paid)}</p>
                            <p className="font-semibold">Net: {formatCurrency(rate.net)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Financial Reports
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleExport('financial', 'pdf')}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('financial', 'excel')}>
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {financialReports.length > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Total Income</div>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(financialReports[0].total_income)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Total Expenses</div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(financialReports[0].total_expenses)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Gross Profit</div>
                      <div className="text-2xl font-bold">{formatCurrency(financialReports[0].gross_profit)}</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Net Profit</div>
                      <div className={`text-2xl font-bold ${financialReports[0].net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(financialReports[0].net_profit)}
                      </div>
                    </div>
                  </div>

                  {/* Income Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Income Breakdown</h3>
                    <div className="space-y-2">
                      {financialReports[0].income_breakdown.map((income) => (
                        <div key={income.source} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium">{income.source}</span>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(income.amount)}</p>
                            <p className="text-sm text-gray-600">{income.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Expense Breakdown</h3>
                    <div className="space-y-2">
                      {financialReports[0].expense_breakdown.map((expense) => (
                        <div key={expense.category} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium">{expense.category}</span>
                          <div className="text-right">
                            <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                            <p className="text-sm text-gray-600">{expense.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
