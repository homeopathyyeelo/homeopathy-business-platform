
import { Card, CardContent } from "@/components/ui/card";

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

const Reports = () => {
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      <ReportHeader onExport={exportReport} />

      <ReportSummaryCards 
        totalSales={totalSales} 
        totalPurchases={totalPurchases} 
        totalProfit={totalProfit} 
      />

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <ReportTypeSelector 
          reportType={reportType} 
          onReportTypeChange={setReportType} 
        />
        
        <ReportDateFilter 
          dateRange={dateRange}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          {reportType === "sales" && (
            <SalesReport 
              invoices={filteredInvoices} 
              customers={customers} 
              startDate={startDate} 
              endDate={endDate}
            />
          )}
          {reportType === "inventory" && (
            <InventoryReport 
              inventory={inventory} 
              products={products}
            />
          )}
          {reportType === "purchase" && (
            <PurchaseReport 
              purchases={filteredPurchases} 
              startDate={startDate} 
              endDate={endDate}
            />
          )}
          {reportType === "customer" && (
            <CustomerReport 
              customers={customers} 
              invoices={filteredInvoices}
            />
          )}
          {reportType === "expiry" && (
            <ExpiryReport 
              inventory={inventory} 
              products={products}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
