'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Plus, Pencil, Trash2, Percent } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface TaxSlab {
  id: string;
  slab_name: string;
  rate: number;
  category: string;
  effective_from: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HSNCode {
  id: string;
  hsn_code: string;
  description: string;
  gst_rate: number;
  cess_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function TaxGSTConfigPage() {
  const [activeTab, setActiveTab] = useState('slabs');
  const [isSlabDialogOpen, setIsSlabDialogOpen] = useState(false);
  const [isHSNDialogOpen, setIsHSNDialogOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<TaxSlab | null>(null);
  const [editingHSN, setEditingHSN] = useState<HSNCode | null>(null);
  const [slabFormData, setSlabFormData] = useState<Partial<TaxSlab>>({});
  const [hsnFormData, setHSNFormData] = useState<Partial<HSNCode>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slabsData, isLoading: slabsLoading } = useQuery({
    queryKey: ['tax-slabs'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/tax/slabs');
      return { slabs: (res.data?.data || []) as TaxSlab[], total: res.data?.total || 0 };
    },
  });

  const { data: hsnData, isLoading: hsnLoading } = useQuery({
    queryKey: ['hsn-codes'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/tax/hsn-codes');
      return { codes: (res.data?.data || []) as HSNCode[], total: res.data?.total || 0 };
    },
  });

  const createSlabMutation = useMutation({
    mutationFn: (data: Partial<TaxSlab>) => golangAPI.post('/api/erp/tax/slabs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-slabs'] });
      toast({ title: 'Success', description: 'Tax slab created' });
      setIsSlabDialogOpen(false);
      setSlabFormData({});
    },
  });

  const updateSlabMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxSlab> }) =>
      golangAPI.put(`/api/erp/tax/slabs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-slabs'] });
      toast({ title: 'Success', description: 'Tax slab updated' });
      setIsSlabDialogOpen(false);
      setEditingSlab(null);
      setSlabFormData({});
    },
  });

  const deleteSlabMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/tax/slabs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-slabs'] });
      toast({ title: 'Success', description: 'Tax slab deleted' });
    },
  });

  const createHSNMutation = useMutation({
    mutationFn: (data: Partial<HSNCode>) => golangAPI.post('/api/erp/tax/hsn-codes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hsn-codes'] });
      toast({ title: 'Success', description: 'HSN code created' });
      setIsHSNDialogOpen(false);
      setHSNFormData({});
    },
  });

  const updateHSNMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HSNCode> }) =>
      golangAPI.put(`/api/erp/tax/hsn-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hsn-codes'] });
      toast({ title: 'Success', description: 'HSN code updated' });
      setIsHSNDialogOpen(false);
      setEditingHSN(null);
      setHSNFormData({});
    },
  });

  const deleteHSNMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/tax/hsn-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hsn-codes'] });
      toast({ title: 'Success', description: 'HSN code deleted' });
    },
  });

  const slabColumns = [
    { key: 'slab_name', title: 'Slab Name', sortable: true },
    { key: 'rate', title: 'Rate (%)', sortable: true, render: (val: number) => `${val}%` },
    { key: 'category', title: 'Category', sortable: true },
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
      render: (_: any, row: TaxSlab) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingSlab(row); setSlabFormData(row); setIsSlabDialogOpen(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this slab?')) deleteSlabMutation.mutate(row.id); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const hsnColumns = [
    { key: 'hsn_code', title: 'HSN Code', sortable: true },
    { key: 'description', title: 'Description', sortable: true },
    { key: 'gst_rate', title: 'GST Rate (%)', sortable: true, render: (val: number) => `${val}%` },
    { key: 'cess_rate', title: 'Cess Rate (%)', sortable: true, render: (val: number) => `${val}%` },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: HSNCode) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditingHSN(row); setHSNFormData(row); setIsHSNDialogOpen(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { if (confirm('Delete this HSN?')) deleteHSNMutation.mutate(row.id); }}>
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
          <Receipt className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tax & GST Settings</h1>
            <p className="text-gray-600">Manage tax slabs and HSN codes</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="slabs"><Percent className="w-4 h-4 mr-2" />Tax Slabs</TabsTrigger>
          <TabsTrigger value="hsn"><Receipt className="w-4 h-4 mr-2" />HSN Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="slabs" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingSlab(null); setSlabFormData({}); setIsSlabDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Tax Slab
            </Button>
          </div>
          <DataTable title="Tax Slabs" columns={slabColumns} data={slabsData?.slabs || []} loading={slabsLoading} />
        </TabsContent>

        <TabsContent value="hsn" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingHSN(null); setHSNFormData({}); setIsHSNDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add HSN Code
            </Button>
          </div>
          <DataTable title="HSN Codes" columns={hsnColumns} data={hsnData?.codes || []} loading={hsnLoading} />
        </TabsContent>
      </Tabs>

      <Dialog open={isSlabDialogOpen} onOpenChange={setIsSlabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlab ? 'Edit Tax Slab' : 'Add Tax Slab'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingSlab ? updateSlabMutation.mutate({ id: editingSlab.id, data: slabFormData }) : createSlabMutation.mutate(slabFormData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="slab_name">Slab Name *</Label>
                <Input id="slab_name" value={slabFormData.slab_name || ''} onChange={(e) => setSlabFormData({ ...slabFormData, slab_name: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="rate">Rate (%) *</Label>
                <Input id="rate" type="number" step="0.01" value={slabFormData.rate || ''} onChange={(e) => setSlabFormData({ ...slabFormData, rate: parseFloat(e.target.value) })} required />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={slabFormData.category || ''} onChange={(e) => setSlabFormData({ ...slabFormData, category: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSlabDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingSlab ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHSNDialogOpen} onOpenChange={setIsHSNDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHSN ? 'Edit HSN Code' : 'Add HSN Code'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingHSN ? updateHSNMutation.mutate({ id: editingHSN.id, data: hsnFormData }) : createHSNMutation.mutate(hsnFormData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="hsn_code">HSN Code *</Label>
                <Input id="hsn_code" value={hsnFormData.hsn_code || ''} onChange={(e) => setHSNFormData({ ...hsnFormData, hsn_code: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={hsnFormData.description || ''} onChange={(e) => setHSNFormData({ ...hsnFormData, description: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="gst_rate">GST Rate (%)</Label>
                <Input id="gst_rate" type="number" step="0.01" value={hsnFormData.gst_rate || ''} onChange={(e) => setHSNFormData({ ...hsnFormData, gst_rate: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="cess_rate">Cess Rate (%)</Label>
                <Input id="cess_rate" type="number" step="0.01" value={hsnFormData.cess_rate || ''} onChange={(e) => setHSNFormData({ ...hsnFormData, cess_rate: parseFloat(e.target.value) })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsHSNDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingHSN ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
