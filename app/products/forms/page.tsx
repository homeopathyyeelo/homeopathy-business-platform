"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function FormsPage() {
  const forms = [
    { id: 1, name: 'Dilution', description: 'Liquid dilutions in alcohol base', unit: 'ml', active: true },
    { id: 2, name: 'Tablets', description: 'Sugar of milk tablets', unit: 'gm', active: true },
    { id: 3, name: 'Biochemic Tablets', description: 'Tissue salt tablets', unit: 'gm', active: true },
    { id: 4, name: 'Ointment', description: 'External application ointments', unit: 'gm', active: true },
    { id: 5, name: 'Drops', description: 'Liquid drops', unit: 'ml', active: true },
    { id: 6, name: 'Mother Tincture', description: 'Original plant extracts', unit: 'ml', active: true },
    { id: 7, name: 'Trituration', description: 'Powder form', unit: 'gm', active: true },
    { id: 8, name: 'Globules', description: 'Small sugar pills', unit: 'gm', active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forms Master</h1>
          <p className="text-muted-foreground">Manage medicine forms and types</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-semibold">{form.name}</TableCell>
                  <TableCell className="text-muted-foreground">{form.description}</TableCell>
                  <TableCell><Badge variant="outline">{form.unit}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={form.active ? 'default' : 'secondary'}>
                      {form.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
