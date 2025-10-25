'use client';

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Pill, Activity } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProductPotencies, usePotencyMutations } from "@/lib/hooks/products";

interface Potency {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  product_count?: number;
}

export default function PotenciesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [editingPotencyId, setEditingPotencyId] = useState<string | null>(null);

  // Use React Query hooks
  const { data: potencies = [], isLoading } = useProductPotencies();
  const { create, update, remove } = usePotencyMutations();

  // Filter potencies based on search term
  const filteredPotencies = potencies.filter((potency: Potency) =>
    potency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    potency.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    potency.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setEditingPotencyId(null);
  };

  const handleAddPotency = async () => {
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a potency name",
        variant: "destructive"
      });
      return;
    }

    try {
      await create.mutateAsync(formData);
      toast({
        title: "Potency Added",
        description: "Potency has been created successfully"
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create potency",
        variant: "destructive"
      });
    }
  };

  const handleEditPotency = (potency: Potency) => {
    setFormData({
      name: potency.name,
      code: potency.code || "",
      description: potency.description || "",
    });
    setEditingPotencyId(potency.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePotency = async () => {
    if (!editingPotencyId || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a potency name",
        variant: "destructive"
      });
      return;
    }

    try {
      await update.mutateAsync({ id: editingPotencyId, data: formData });
      toast({
        title: "Potency Updated",
        description: "Potency has been updated successfully"
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update potency",
        variant: "destructive"
      });
    }
  };

  const handleDeletePotency = async (potencyId: string) => {
    if (confirm("Are you sure you want to delete this potency?")) {
      try {
        await remove.mutateAsync(potencyId);
        toast({
          title: "Potency Deleted",
          description: "Potency has been deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete potency",
          variant: "destructive"
        });
      }
    }
  };

  // Calculate stats
  const totalPotencies = potencies.length;
  const activePotencies = potencies.filter((p: Potency) => p.isActive !== false).length;
  const totalProducts = potencies.reduce((sum: number, p: Potency) => sum + (p.product_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Potencies Master</h2>
          <p className="text-muted-foreground">Manage homeopathy potency scales</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Potency
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Pill className="w-4 h-4 mr-2" />
              Total Potencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPotencies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Active Potencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePotencies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search potencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Potency Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading potencies...
                  </TableCell>
                </TableRow>
              ) : filteredPotencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No potencies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPotencies.map((potency: Potency) => (
                  <TableRow key={potency.id}>
                    <TableCell className="font-medium">{potency.name}</TableCell>
                    <TableCell className="font-mono">{potency.code || 'N/A'}</TableCell>
                    <TableCell>{potency.description || 'No description'}</TableCell>
                    <TableCell>{potency.product_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={potency.isActive !== false ? 'default' : 'secondary'}>
                        {potency.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPotency(potency)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePotency(potency.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Potency</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Potency Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., 30C, 200C, 1M" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" value={formData.code} onChange={handleInputChange} placeholder="e.g., 30C" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="e.g., Centesimal potency" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPotency}>Add Potency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Potency</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Potency Name *</Label>
              <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input id="edit-code" name="code" value={formData.code} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" name="description" value={formData.description} onChange={handleInputChange} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePotency}>Update Potency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
