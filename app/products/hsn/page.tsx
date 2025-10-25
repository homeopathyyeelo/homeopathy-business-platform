'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, FileText, Percent } from "lucide-react";
import { golangAPI } from "@/lib/api";

interface HSNCode {
  id: string;
  hsn_code: string;
  description: string;
  gst_rate: number;
  category?: string;
  is_active: boolean;
}

export default function HSNCodesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    hsn_code: "",
    description: "",
    gst_rate: "",
    category: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch HSN codes
  const { data: hsnCodes = [], isLoading } = useQuery({
    queryKey: ['hsn-codes'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/hsn-codes');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/hsn-codes', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hsn-codes'] });
      toast({ title: "HSN Code Created", description: "HSN code has been created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create HSN code", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/hsn-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hsn-codes'] });
      toast({ title: "HSN Code Updated", description: "HSN code has been updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update HSN code", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/hsn-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hsn-codes'] });
      toast({ title: "HSN Code Deleted", description: "HSN code has been deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete HSN code", variant: "destructive" });
    },
  });

  // Filter HSN codes
  const filteredHSNCodes = hsnCodes.filter((hsn: HSNCode) =>
    hsn.hsn_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hsn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hsn.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: hsnCodes.length,
    gst12: hsnCodes.filter((h: HSNCode) => h.gst_rate === 12).length,
    gst18: hsnCodes.filter((h: HSNCode) => h.gst_rate === 18).length,
    active: hsnCodes.filter((h: HSNCode) => h.is_active).length,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ hsn_code: "", description: "", gst_rate: "", category: "" });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formData.hsn_code || !formData.description || !formData.gst_rate) {
      toast({
        title: "Missing Information",
        description: "Please provide HSN code, description, and GST rate",
        variant: "destructive"
      });
      return;
    }

    await createMutation.mutateAsync({
      ...formData,
      gst_rate: parseFloat(formData.gst_rate),
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (hsn: HSNCode) => {
    setFormData({
      hsn_code: hsn.hsn_code,
      description: hsn.description,
      gst_rate: hsn.gst_rate.toString(),
      category: hsn.category || "",
    });
    setEditingId(hsn.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.hsn_code || !formData.description || !formData.gst_rate || !editingId) {
      toast({
        title: "Missing Information",
        description: "Please provide all required information",
        variant: "destructive"
      });
      return;
    }

    await updateMutation.mutateAsync({
      id: editingId,
      data: {
        ...formData,
        gst_rate: parseFloat(formData.gst_rate),
      }
    });
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete HSN code "${code}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HSN Codes</h1>
          <p className="text-muted-foreground">Manage HSN codes with GST rates (October 2025)</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add HSN Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total HSN Codes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GST 12%</CardTitle>
            <Percent className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.gst12}</div>
            <p className="text-xs text-muted-foreground">Medicines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GST 18%</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.gst18}</div>
            <p className="text-xs text-muted-foreground">Cosmetics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search HSN codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* HSN Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All HSN Codes ({filteredHSNCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredHSNCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No HSN codes found matching your search" : "No HSN codes yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>GST Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHSNCodes.map((hsn: HSNCode) => (
                  <TableRow key={hsn.id}>
                    <TableCell className="font-mono font-bold">{hsn.hsn_code}</TableCell>
                    <TableCell className="max-w-xs">{hsn.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{hsn.category || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={hsn.gst_rate === 12 ? "default" : "secondary"}
                        className={hsn.gst_rate === 12 ? "bg-green-600" : "bg-blue-600"}
                      >
                        {hsn.gst_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hsn.is_active ? "default" : "secondary"}>
                        {hsn.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(hsn)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(hsn.id, hsn.hsn_code)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New HSN Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN Code *</Label>
              <Input
                id="hsn_code"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleInputChange}
                placeholder="e.g., 3004"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="HSN code description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Medicines"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_rate">GST Rate (%) *</Label>
              <Input
                id="gst_rate"
                name="gst_rate"
                type="number"
                step="0.01"
                value={formData.gst_rate}
                onChange={handleInputChange}
                placeholder="e.g., 12.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create HSN Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit HSN Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-hsn_code">HSN Code *</Label>
              <Input
                id="edit-hsn_code"
                name="hsn_code"
                value={formData.hsn_code}
                onChange={handleInputChange}
                placeholder="e.g., 3004"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="HSN code description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Medicines"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-gst_rate">GST Rate (%) *</Label>
              <Input
                id="edit-gst_rate"
                name="gst_rate"
                type="number"
                step="0.01"
                value={formData.gst_rate}
                onChange={handleInputChange}
                placeholder="e.g., 12.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update HSN Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
