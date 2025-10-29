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
import { Mail, MessageSquare, Plus, Pencil, Trash2, Radio } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface GatewayConfig {
  id: string;
  type: string;
  name: string;
  config: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmailWhatsAppGatewayPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GatewayConfig | null>(null);
  const [formData, setFormData] = useState<Partial<GatewayConfig>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['gateway-configs'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/gateway/configs');
      return { items: (res.data?.data || []) as GatewayConfig[], total: res.data?.total || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<GatewayConfig>) => golangAPI.post('/api/erp/gateway/configs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-configs'] });
      toast({ title: 'Success', description: 'Gateway config created' });
      setIsDialogOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GatewayConfig> }) =>
      golangAPI.put(`/api/erp/gateway/configs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-configs'] });
      toast({ title: 'Success', description: 'Gateway config updated' });
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/gateway/configs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-configs'] });
      toast({ title: 'Success', description: 'Gateway config deleted' });
    },
  });

  const testMutation = useMutation({
    mutationFn: (type: string) => golangAPI.post(`/api/erp/gateway/test/${type}`, {}),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Connection test successful' });
    },
  });

  const columns = [
    { key: 'name', title: 'Gateway Name', sortable: true },
    { 
      key: 'type', 
      title: 'Type', 
      sortable: true,
      render: (val: string) => (
        <div className="flex items-center gap-2">
          {val === 'smtp' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          <span className="uppercase">{val}</span>
        </div>
      )
    },
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
      render: (_: any, row: GatewayConfig) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => testMutation.mutate(row.type)}>
            <Radio className="w-4 h-4" />
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
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email/WhatsApp Gateway</h1>
            <p className="text-gray-600">Manage SMTP and WhatsApp API configurations</p>
          </div>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({}); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Gateway
        </Button>
      </div>

      <DataTable title="Gateway Configurations" columns={columns} data={data?.items || []} loading={isLoading} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Gateway' : 'Add Gateway'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingItem ? updateMutation.mutate({ id: editingItem.id, data: formData }) : createMutation.mutate(formData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Gateway Name *</Label>
                <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select id="type" className="w-full px-3 py-2 border rounded-md" value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                  <option value="">Select type</option>
                  <option value="smtp">SMTP (Email)</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <Label htmlFor="config">Configuration (JSON) *</Label>
                <Textarea id="config" rows={8} value={formData.config || ''} onChange={(e) => setFormData({ ...formData, config: e.target.value })} placeholder='{"host": "smtp.gmail.com", "port": 587, "username": "...", "password": "..."}' required />
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
