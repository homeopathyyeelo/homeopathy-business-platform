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
import { Brain, Plus, Pencil, Trash2, Zap } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface AIModel {
  id: string;
  model_name: string;
  endpoint: string;
  api_key: string;
  params: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AIModelSelectionPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState<Partial<AIModel>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/ai-models');
      return { items: (res.data?.data || []) as AIModel[], total: res.data?.total || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AIModel>) => golangAPI.post('/api/erp/ai-models', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast({ title: 'Success', description: 'AI model created' });
      setIsDialogOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AIModel> }) =>
      golangAPI.put(`/api/erp/ai-models/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast({ title: 'Success', description: 'AI model updated' });
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/ai-models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      toast({ title: 'Success', description: 'AI model deleted' });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => golangAPI.post('/api/erp/ai-models/test', {}),
    onSuccess: () => {
      toast({ title: 'Success', description: 'AI model test successful' });
    },
  });

  const columns = [
    { key: 'model_name', title: 'Model Name', sortable: true },
    { key: 'endpoint', title: 'Endpoint', sortable: true },
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
      render: (_: any, row: AIModel) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => testMutation.mutate()}>
            <Zap className="w-4 h-4" />
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
          <Brain className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Model Selection</h1>
            <p className="text-gray-600">Configure AI models and endpoints</p>
          </div>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({}); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Model
        </Button>
      </div>

      <DataTable title="AI Models" columns={columns} data={data?.items || []} loading={isLoading} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit AI Model' : 'Add AI Model'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editingItem ? updateMutation.mutate({ id: editingItem.id, data: formData }) : createMutation.mutate(formData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="model_name">Model Name *</Label>
                <Input id="model_name" value={formData.model_name || ''} onChange={(e) => setFormData({ ...formData, model_name: e.target.value })} placeholder="e.g., GPT-4, Claude-3" required />
              </div>
              <div>
                <Label htmlFor="endpoint">Endpoint URL *</Label>
                <Input id="endpoint" value={formData.endpoint || ''} onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })} placeholder="https://api.openai.com/v1/chat/completions" required />
              </div>
              <div>
                <Label htmlFor="api_key">API Key *</Label>
                <Input id="api_key" type="password" value={formData.api_key || ''} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="params">Parameters (JSON)</Label>
                <Textarea id="params" rows={4} value={formData.params || ''} onChange={(e) => setFormData({ ...formData, params: e.target.value })} placeholder='{"temperature": 0.7, "max_tokens": 1000}' />
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
