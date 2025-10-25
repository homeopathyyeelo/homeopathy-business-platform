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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Scale, Package } from "lucide-react";
import { golangAPI } from "@/lib/api";

interface Unit {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit_type?: string;
  is_active: boolean;
}

export default function UnitsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    unit_type: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch units
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await golangAPI.get('/api/erp/units');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => golangAPI.post('/api/erp/units', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: "Unit Created", description: "Unit has been created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create unit", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      golangAPI.put(`/api/erp/units/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: "Unit Updated", description: "Unit has been updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update unit", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => golangAPI.delete(`/api/erp/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: "Unit Deleted", description: "Unit has been deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete unit", variant: "destructive" });
    },
  });

  // Filter units
  const filteredUnits = units.filter((unit: Unit) =>
    unit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.unit_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: units.length,
    volume: units.filter((u: Unit) => u.unit_type === 'Volume').length,
    weight: units.filter((u: Unit) => u.unit_type === 'Weight').length,
    count: units.filter((u: Unit) => u.unit_type === 'Count').length,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", unit_type: "" });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: "Missing Information",
        description: "Please provide unit name and code",
        variant: "destructive"
      });
      return;
    }

    await createMutation.mutateAsync(formData);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (unit: Unit) => {
    setFormData({
      name: unit.name,
      code: unit.code,
      description: unit.description || "",
      unit_type: unit.unit_type || "",
    });
    setEditingId(unit.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.code || !editingId) {
      toast({
        title: "Missing Information",
        description: "Please provide all required information",
        variant: "destructive"
      });
      return;
    }

    await updateMutation.mutateAsync({
      id: editingId,
      data: formData
    });
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete unit "${name}"?`)) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Units of Measurement</h1>
          <p className="text-muted-foreground">Manage product units (Volume, Weight, Count)</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Units</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.volume}</div>
            <p className="text-xs text-muted-foreground">ml, L, drops</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight Units</CardTitle>
            <Scale className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.weight}</div>
            <p className="text-xs text-muted-foreground">g, kg, mg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Count Units</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.count}</div>
            <p className="text-xs text-muted-foreground">pcs, bottle, strip</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Units ({filteredUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No units found matching your search" : "No units yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit: Unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{unit.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          unit.unit_type === 'Volume' ? 'bg-blue-100 text-blue-800' :
                          unit.unit_type === 'Weight' ? 'bg-green-100 text-green-800' :
                          unit.unit_type === 'Count' ? 'bg-purple-100 text-purple-800' :
                          ''
                        }
                      >
                        {unit.unit_type || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {unit.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.is_active ? "default" : "secondary"}>
                        {unit.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(unit.id, unit.name)}
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
            <DialogTitle>Add New Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Unit Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Milliliter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_type">Unit Type</Label>
              <Select
                value={formData.unit_type || "none"}
                onValueChange={(value) => handleSelectChange('unit_type', value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Volume">Volume</SelectItem>
                  <SelectItem value="Weight">Weight</SelectItem>
                  <SelectItem value="Count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Unit description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Unit Name *</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Milliliter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-unit_type">Unit Type</Label>
              <Select
                value={formData.unit_type || "none"}
                onValueChange={(value) => handleSelectChange('unit_type', value === "none" ? "" : value)}
              >
                <SelectTrigger id="edit-unit_type">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Volume">Volume</SelectItem>
                  <SelectItem value="Weight">Weight</SelectItem>
                  <SelectItem value="Count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Unit description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
