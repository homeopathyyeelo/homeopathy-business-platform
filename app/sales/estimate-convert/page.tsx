"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/common/DataTable";

export default function EstimateConvertPage() {
  const [estimates, setEstimates] = useState([]);
  
  useEffect(() => {
    fetch('http://localhost:3005/api/erp/estimates?status=sent')
      .then(r => r.json())
      .then(d => setEstimates(d.data || []));
  }, []);

  const handleConvert = async (id: string) => {
    const res = await fetch(`http://localhost:3005/api/erp/estimates/${id}/convert`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/sales/invoices/${data.data.id}`;
    }
  };

  const columns = [
    { key: "estimate_no", title: "Estimate #" },
    { key: "customer_name", title: "Customer" },
    { key: "total", title: "Amount", render: (value: number) => `₹${value}` },
    { key: "valid_until", title: "Valid Until", render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Convert Estimates to Invoices</h1>
      <Card>
        <CardHeader><CardTitle>Pending Estimates</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            title="Estimates"
            columns={columns}
            data={estimates}
            onEdit={(row) => handleConvert(row.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
