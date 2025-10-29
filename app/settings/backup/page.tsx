'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { golangAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Database, Plus, Download, RotateCw } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

interface Backup {
  id: string;
  filename: string;
  size: number;
  status: string;
  created_at: string;
  created_by?: string;
}

export default function BackupRestorePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Backup>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/backups');
      return { items: (res.data?.data || []) as Backup[], total: res.data?.total || 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Backup>) => golangAPI.post('/api/erp/backups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast({ title: 'Success', description: 'Backup initiated' });
      setIsDialogOpen(false);
      setFormData({});
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => golangAPI.post(`/api/erp/backups/${id}/restore`, {}),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Restore initiated' });
    },
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const columns = [
    { key: 'filename', title: 'Filename', sortable: true },
    { key: 'size', title: 'Size', sortable: true, render: (val: number) => formatSize(val) },
    { 
      key: 'status', 
      title: 'Status', 
      sortable: true,
      render: (val: string) => (
        <span className={`px-2 py-1 rounded text-xs ${
          val === 'completed' ? 'bg-green-100 text-green-700' :
          val === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {val}
        </span>
      )
    },
    { key: 'created_at', title: 'Created', sortable: true, render: (val: string) => new Date(val).toLocaleString() },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: Backup) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(row.id)}>
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
            <p className="text-gray-600">Create and manage system backups</p>
          </div>
        </div>
        <Button onClick={() => { setFormData({}); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Backup
        </Button>
      </div>

      <DataTable title="Backups" columns={columns} data={data?.items || []} loading={isLoading} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="filename">Filename *</Label>
                <Input id="filename" value={formData.filename || ''} onChange={(e) => setFormData({ ...formData, filename: e.target.value })} placeholder="backup_2024.zip" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
