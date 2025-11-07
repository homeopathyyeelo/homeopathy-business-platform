'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/api/fetch-utils';

interface LineItem {
  id: string;
  sku: string;
  productName: string;
  qty: number;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export default function PurchaseOrderCreatePage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addLine = () => {
    setLines([...lines, { 
      id: Date.now().toString(), 
      sku: '', 
      productName: '', 
      qty: 1, 
      unitPrice: 0, 
      taxPercent: 12, 
      amount: 0 
    }]);
  };

  const updateLine = (id: string, field: keyof LineItem, value: any) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      if (field === 'qty' || field === 'unitPrice' || field === 'taxPercent') {
        updated.amount = updated.qty * updated.unitPrice * (1 + updated.taxPercent / 100);
      }
      return updated;
    }));
  };

  const removeLine = (id: string) => setLines(lines.filter(l => l.id !== id));

  const handleSubmit = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!vendorId || lines.length === 0) {
      alert('Please select vendor and add at least one line item');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, orderDate, lines, status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`PO ${data.id} ${status === 'DRAFT' ? 'saved as draft' : 'confirmed'}`);
        router.push('/purchases/orders');
      } else {
        alert('Error: ' + (data.error || 'Failed to create PO'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const total = lines.reduce((s, l) => s + l.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Create Purchase Order</h1>
          <p className="text-gray-600">Add vendor, line items, and save as draft or confirm</p>
        </div>
        <div className="space-x-2">
          <button onClick={() => handleSubmit('DRAFT')} disabled={loading} className="px-4 py-2 bg-gray-200 rounded">
            Save Draft
          </button>
          <button onClick={() => handleSubmit('CONFIRMED')} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            Confirm Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md border p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select value={vendorId} onChange={e => setVendorId(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Vendor</option>
              <option value="v1">SBL Pharmaceuticals</option>
              <option value="v2">Dr. Reckeweg</option>
              <option value="v3">Allen Homoeo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Date</label>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Line Items</h3>
            <button onClick={addLine} className="px-3 py-1 bg-green-600 text-white rounded text-sm">+ Add Line</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Unit Price</th>
                  <th className="p-2 text-left">Tax %</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.id} className="border-b">
                    <td className="p-2"><input value={l.sku} onChange={e => updateLine(l.id, 'sku', e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                    <td className="p-2"><input value={l.productName} onChange={e => updateLine(l.id, 'productName', e.target.value)} className="w-full border rounded px-2 py-1" /></td>
                    <td className="p-2"><input type="number" value={l.qty} onChange={e => updateLine(l.id, 'qty', +e.target.value)} className="w-20 border rounded px-2 py-1" /></td>
                    <td className="p-2"><input type="number" value={l.unitPrice} onChange={e => updateLine(l.id, 'unitPrice', +e.target.value)} className="w-24 border rounded px-2 py-1" /></td>
                    <td className="p-2"><input type="number" value={l.taxPercent} onChange={e => updateLine(l.id, 'taxPercent', +e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                    <td className="p-2 font-semibold">{l.amount.toFixed(2)}</td>
                    <td className="p-2"><button onClick={() => removeLine(l.id)} className="text-red-600 text-xs">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lines.length === 0 && <div className="text-center py-4 text-gray-500">No items added yet</div>}
        </div>

        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-lg font-bold">Total: ₹{total.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
