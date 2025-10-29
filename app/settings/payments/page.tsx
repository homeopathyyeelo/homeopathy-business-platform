'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  config: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PaymentMethodsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/payment-methods');
      return { items: (res.data?.data || []) as PaymentMethod[], total: res.data?.total || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PaymentMethod>) => golangAPI.post('/api/erp/payment-methods', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: 'Success', description: 'Payment method created' });
      setIsDialogOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentMethod> }) =>
      golangAPI.put(`/api/erp/payment-methods/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: 'Success', description: 'Payment method updated' });
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast({ title: 'Success', description: 'Payment method deleted' });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => golangAPI.post('/api/erp/payment-methods/test', {}),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Connection test successful' });
    },
  });

  const columns = [
    { key: 'name', title: 'Method Name', sortable: true },
    { key: 'type', title: 'Type', sortable: true },
    {
      key: 'is_active',
      title: 'Status',
      render: (val: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {val ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: PaymentMethod) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => testMutation.mutate()}>
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditingItem(row); setFormData(row); setIsDialogOpen(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row.id); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
            <p className="text-gray-600">Manage payment gateway configurations</p>
          </div>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({}); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Method
        </Button>
      </div>

      <DataTable title="Payment Methods" columns={columns} data={data?.items || []} loading={isLoading} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingItem ? updateMutation.mutate({ id: editingItem.id, data: formData }) : createMutation.mutate(formData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Method Name *</Label>
                <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Input id="type" value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="e.g., stripe, razorpay, paytm" required />
              </div>
              <div>
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea id="config" rows={6} value={formData.config || ''} onChange={(e) => setFormData({ ...formData, config: e.target.value })} placeholder='{"api_key": "...", "secret": "..."}' />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
