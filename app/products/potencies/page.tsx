"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function PotenciesPage() {
  const potencies = [
    { id: 1, code: '30C', name: '30 Centesimal', type: 'Centesimal', active: true },
    { id: 2, code: '200C', name: '200 Centesimal', type: 'Centesimal', active: true },
    { id: 3, code: '1M', name: '1000 Centesimal', type: 'Centesimal', active: true },
    { id: 4, code: '10M', name: '10000 Centesimal', type: 'Centesimal', active: true },
    { id: 5, code: 'Q', name: 'LM Potency', type: 'LM', active: true },
    { id: 6, code: '6X', name: '6 Decimal', type: 'Decimal', active: true },
    { id: 7, code: '12X', name: '12 Decimal', type: 'Decimal', active: true },
    { id: 8, code: '30X', name: '30 Decimal', type: 'Decimal', active: true },
    { id: 9, code: 'MT', name: 'Mother Tincture', type: 'Mother Tincture', active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Potencies Master</h1>
          <p className="text-muted-foreground">Manage homeopathy potency scales</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Potency
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Potencies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {potencies.map((potency) => (
                <TableRow key={potency.id}>
                  <TableCell className="font-mono font-semibold">{potency.code}</TableCell>
                  <TableCell>{potency.name}</TableCell>
                  <TableCell><Badge variant="outline">{potency.type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={potency.active ? 'default' : 'secondary'}>
                      {potency.active ? 'Active' : 'Inactive'}
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
