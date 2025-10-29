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
import { Key, Plus, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface Integration {
  id: string;
  provider: string;
  api_key: string;
  meta: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function IntegrationsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Partial<Integration>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/integrations');
      return { items: (res.data?.data || []) as Integration[], total: res.data?.total || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Integration>) => golangAPI.post('/api/erp/integrations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: 'Success', description: 'Integration created' });
      setIsDialogOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Integration> }) =>
      golangAPI.put(`/api/erp/integrations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: 'Success', description: 'Integration updated' });
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/integrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: 'Success', description: 'Integration deleted' });
    },
  });

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return key.slice(0, 4) + '••••' + key.slice(-4);
  };

  const columns = [
    { key: 'provider', title: 'Provider', sortable: true },
    {
      key: 'api_key',
      title: 'API Key',
      render: (val: string, row: Integration) => (
        <div className="flex items-center gap-2">
          <code className="text-sm">{visibleKeys[row.id] ? val : maskKey(val)}</code>
          <Button size="sm" variant="ghost" onClick={() => setVisibleKeys({ ...visibleKeys, [row.id]: !visibleKeys[row.id] })}>
            {visibleKeys[row.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(val); toast({ title: 'Copied!' }); }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      ),
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
      render: (_: any, row: Integration) => (
        <div className="flex gap-2">
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
          <Key className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integration Keys</h1>
            <p className="text-gray-600">Manage third-party API keys and credentials</p>
          </div>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({}); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Integration
        </Button>
      </div>

      <DataTable title="Integrations" columns={columns} data={data?.items || []} loading={isLoading} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Integration' : 'Add Integration'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingItem ? updateMutation.mutate({ id: editingItem.id, data: formData }) : createMutation.mutate(formData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="provider">Provider Name *</Label>
                <Input id="provider" value={formData.provider || ''} onChange={(e) => setFormData({ ...formData, provider: e.target.value })} placeholder="e.g., Stripe, Twilio, AWS" required />
              </div>
              <div>
                <Label htmlFor="api_key">API Key *</Label>
                <Input id="api_key" type="password" value={formData.api_key || ''} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="meta">Metadata (JSON)</Label>
                <Textarea id="meta" rows={4} value={formData.meta || ''} onChange={(e) => setFormData({ ...formData, meta: e.target.value })} placeholder='{"region": "us-east-1", "environment": "production"}' />
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
