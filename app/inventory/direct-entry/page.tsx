"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DirectEntryPage() {
  const [data, setData] = useState({ product_id: "", qty: 0, batch: "", reason: "" });

  const addStock = async () => {
    await fetch('http://localhost:3005/api/erp/inventory/direct-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Direct Stock Entry</h1>
      <Card>
        <CardHeader><CardTitle>Add Stock Without PO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Product ID" onChange={e => setData({...data, product_id: e.target.value})} />
          <Input type="number" placeholder="Quantity" onChange={e => setData({...data, qty: Number(e.target.value)})} />
          <Input placeholder="Batch No" onChange={e => setData({...data, batch: e.target.value})} />
          <Input placeholder="Reason" onChange={e => setData({...data, reason: e.target.value})} />
          <Button onClick={addStock}>Add Stock</Button>
        </CardContent>
      </Card>
    </div>
  );
}
