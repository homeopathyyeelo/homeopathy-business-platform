"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch } from '@/lib/api/fetch-utils';

export default function ComboPage() {
  const [items, setItems] = useState([{ product_id: "", qty: 1 }]);

  const addItem = () => setItems([...items, { product_id: "", qty: 1 }]);
  
  const createCombo = async () => {
    await authFetch('http://localhost:3005/api/erp/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "New Combo", items })
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Combo Packs / Bundles</h1>
      <Card>
        <CardHeader><CardTitle>Create Combo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Product ID" value={item.product_id} 
                onChange={e => { const n = [...items]; n[i].product_id = e.target.value; setItems(n); }} />
              <Input type="number" placeholder="Qty" value={item.qty} 
                onChange={e => { const n = [...items]; n[i].qty = Number(e.target.value); setItems(n); }} />
            </div>
          ))}
          <Button onClick={addItem} variant="outline">Add Item</Button>
          <Button onClick={createCombo} className="ml-2">Create Combo</Button>
        </CardContent>
      </Card>
    </div>
  );
}
