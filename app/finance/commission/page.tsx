"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import DataTable from "@/components/common/DataTable";

export default function CommissionPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCommissionReport();
  }, []);

  const fetchCommissionReport = async () => {
    setLoading(true);
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await fetch(`${API_URL}/api/erp/commissions/report?period=current-month`);
    if (res.ok) {
      const data = await res.json();
      setReports(data.data || []);
    }
    setLoading(false);
  };

  const handlePay = async (salesmanId: string, amount: number) => {
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    await fetch(`${API_URL}/api/erp/commissions/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesman_id: salesmanId, amount, payment_mode: 'bank' })
    });
    fetchCommissionReport();
  };

  const columns = [
    { key: "salesman_name", title: "Salesman", sortable: true },
    { 
      key: "total_sales", 
      title: "Total Sales",
      render: (val: number) => `₹${val.toLocaleString()}`
    },
    { 
      key: "commission", 
      title: "Commission",
      render: (val: number) => <span className="font-bold text-green-600">₹{val.toLocaleString()}</span>
    },
    { 
      key: "paid", 
      title: "Paid",
      render: (val: number) => `₹${val.toLocaleString()}`
    },
    { 
      key: "pending", 
      title: "Pending",
      render: (val: number) => <span className="font-bold text-orange-600">₹{val.toLocaleString()}</span>
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-green-500" />
          Salesman Commission
        </h1>
        <p className="text-muted-foreground">Track and manage sales commissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Salesmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹18,450</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹11,900</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹6,550</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Report</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={reports}
              actions={[
                { 
                  label: "Pay Commission", 
                  onClick: (row) => handlePay(row.salesman_id, row.pending)
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
