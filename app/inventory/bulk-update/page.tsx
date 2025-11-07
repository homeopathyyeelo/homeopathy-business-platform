"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from '@/lib/api/fetch-utils';

export default function BulkUpdatePage() {
  const [ids, setIds] = useState("");
  const [updates, setUpdates] = useState({ mrp: "", price: "", hsn: "" });

  const handleBulkUpdate = async () => {
    const res = await authFetch('http://localhost:3005/api/erp/products/bulk-update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: ids.split(',').map(id => id.trim()),
        updates: Object.fromEntries(Object.entries(updates).filter(([k,v]) => v))
      })
    });
    if (res.ok) alert('Updated successfully');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Bulk Product Update</h1>
      <Card>
        <CardHeader><CardTitle>Update Multiple Products</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Product IDs (comma-separated)</label>
            <Textarea value={ids} onChange={e => setIds(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input placeholder="New MRP" onChange={e => setUpdates({...updates, mrp: e.target.value})} />
            <Input placeholder="New Price" onChange={e => setUpdates({...updates, price: e.target.value})} />
            <Input placeholder="New HSN" onChange={e => setUpdates({...updates, hsn: e.target.value})} />
          </div>
          <Button onClick={handleBulkUpdate}>Update All</Button>
        </CardContent>
      </Card>
    </div>
  );
}
