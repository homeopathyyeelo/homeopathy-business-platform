"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/common/DataTable";

export default function HoldBillsPage() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3005/api/erp/pos/held-bills')
      .then(r => r.json())
      .then(d => setBills(d.data || []));
  }, []);

  const columns = [
    { key: "id", title: "ID" },
    { key: "total", title: "Amount", render: (v: number) => `₹${v}` },
    { key: "held_by", title: "Held By" },
    { key: "held_at", title: "Time", render: (v: string) => new Date(v).toLocaleString() },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Hold Bills</h1>
      <Card>
        <CardHeader><CardTitle>Held Bills</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={bills} />
        </CardContent>
      </Card>
    </div>
  );
}
