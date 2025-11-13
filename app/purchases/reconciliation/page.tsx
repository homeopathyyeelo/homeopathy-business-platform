"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/api/fetch-utils';
import { apiFetch } from '@/lib/utils/api-fetch';

export default function ReconciliationPage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const res = await apiFetch('/api/v1/invoices/pending');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to load:', error);
    }
  };

  const handleConfirm = async (id) => {
    await authFetch(`/api/v1/invoices/${id}/confirm`, { method: 'POST' });
    alert('Invoice confirmed!');
    loadInvoices();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Invoice Reconciliation</h1>
      
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{invoice.invoice_number}</h3>
                <p className="text-sm text-gray-600">Amount: ₹{invoice.total_amount}</p>
              </div>
              <Button onClick={() => handleConfirm(invoice.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
