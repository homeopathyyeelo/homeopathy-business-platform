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
import { Plus, Search, Edit, Trash2, Package, Layers } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProductForms, useFormMutations } from "@/lib/hooks/products";

interface Form {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  product_count?: number;
}

export default function FormsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [editingFormId, setEditingFormId] = useState<string | null>(null);

  // Use React Query hooks
  const { data: forms = [], isLoading } = useProductForms();
  const { create, update, remove } = useFormMutations();

  // Filter forms based on search term
  const filteredForms = forms.filter((form: Form) =>
    form.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
    setEditingFormId(null);
  };

  const handleAddForm = async () => {
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a form name",
        variant: "destructive"
      });
      return;
    }

    try {
      await create.mutateAsync(formData);
      toast({
        title: "Form Added",
        description: "Form has been created successfully"
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create form",
        variant: "destructive"
      });
    }
  };

  const handleEditForm = (form: Form) => {
    setFormData({
      name: form.name,
      code: form.code || "",
      description: form.description || "",
    });
    setEditingFormId(form.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateForm = async () => {
    if (!editingFormId || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a form name",
        variant: "destructive"
      });
      return;
    }

    try {
      await update.mutateAsync({ id: editingFormId, data: formData });
      toast({
        title: "Form Updated",
        description: "Form has been updated successfully"
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update form",
        variant: "destructive"
      });
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        await remove.mutateAsync(formId);
        toast({
          title: "Form Deleted",
          description: "Form has been deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete form",
          variant: "destructive"
        });
      }
    }
  };

  // Calculate stats
  const totalForms = forms.length;
  const activeForms = forms.filter((f: Form) => f.isActive !== false).length;
  const totalProducts = forms.reduce((sum: number, f: Form) => sum + (f.product_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Forms Master</h2>
          <p className="text-muted-foreground">Manage medicine forms and types</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Form
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Total Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalForms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Active Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeForms}</div>
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
          placeholder="Search forms..."
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
                <TableHead>Form Name</TableHead>
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
                    Loading forms...
                  </TableCell>
                </TableRow>
              ) : filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No forms found
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map((form: Form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="font-mono">{form.code || 'N/A'}</TableCell>
                    <TableCell>{form.description || 'No description'}</TableCell>
                    <TableCell>{form.product_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={form.isActive !== false ? 'default' : 'secondary'}>
                        {form.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditForm(form)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteForm(form.id)}>
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
            <DialogTitle>Add New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Form Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Liquid, Tablets, Globules" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" value={formData.code} onChange={handleInputChange} placeholder="e.g., LIQ, TAB" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="e.g., Liquid dilutions in alcohol base" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddForm}>Add Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Form Name *</Label>
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
            <Button onClick={handleUpdateForm}>Update Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
