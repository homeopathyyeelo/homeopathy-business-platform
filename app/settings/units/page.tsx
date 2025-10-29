'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Ruler, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface Unit {
  id: string;
  name: string;
  short_name: string;
  base_unit_id?: string;
  conversion_factor: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function UnitsMeasuresPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<Partial<Unit>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/units-settings');
      return { items: (res.data?.data || []) as Unit[], total: res.data?.total || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Unit>) => golangAPI.post('/api/erp/units-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Success', description: 'Unit created' });
      setIsDialogOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Unit> }) =>
      golangAPI.put(`/api/erp/units-settings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Success', description: 'Unit updated' });
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/units-settings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Success', description: 'Unit deleted' });
    },
  });

  const columns = [
    { key: 'name', title: 'Unit Name', sortable: true },
    { key: 'short_name', title: 'Short Name', sortable: true },
    { key: 'conversion_factor', title: 'Conversion Factor', sortable: true },
    {
      key: 'base_unit_id',
      title: 'Base Unit',
      render: (val: string | undefined) => {
        if (!val) return <span className="text-gray-400">None (Base)</span>;
        const baseUnit = data?.items.find(u => u.id === val);
        return baseUnit?.short_name || 'N/A';
      },
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
      render: (_: any, row: Unit) => (
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
          <Ruler className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Units of Measure</h1>
            <p className="text-gray-600">Manage measurement units and conversions</p>
          </div>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({ conversion_factor: 1 }); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Unit
        </Button>
      </div>

      <DataTable title="Units" columns={columns} data={data?.items || []} loading={isLoading} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Unit' : 'Add Unit'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingItem ? updateMutation.mutate({ id: editingItem.id, data: formData }) : createMutation.mutate(formData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Unit Name *</Label>
                <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Kilogram" required />
              </div>
              <div>
                <Label htmlFor="short_name">Short Name *</Label>
                <Input id="short_name" value={formData.short_name || ''} onChange={(e) => setFormData({ ...formData, short_name: e.target.value })} placeholder="e.g., kg" required />
              </div>
              <div>
                <Label htmlFor="base_unit_id">Base Unit</Label>
                <select id="base_unit_id" className="w-full px-3 py-2 border rounded-md" value={formData.base_unit_id || ''} onChange={(e) => setFormData({ ...formData, base_unit_id: e.target.value || undefined })}>
                  <option value="">None (This is a base unit)</option>
                  {data?.items.filter(u => u.id !== editingItem?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="conversion_factor">Conversion Factor *</Label>
                <Input id="conversion_factor" type="number" step="0.001" value={formData.conversion_factor || 1} onChange={(e) => setFormData({ ...formData, conversion_factor: parseFloat(e.target.value) })} required />
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
