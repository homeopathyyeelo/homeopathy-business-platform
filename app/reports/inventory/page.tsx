"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Package } from "lucide-react";

export default function InventoryReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Inventory Reports
          </h1>
          <p className="text-muted-foreground">Stock movement and inventory analysis</p>
        </div>
        <Button><Download className="h-4 w-4 mr-2" />Export Report</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Stock Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Opening Stock</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Closing Stock</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Sample Product</TableCell>
                <TableCell>100</TableCell>
                <TableCell>50</TableCell>
                <TableCell>75</TableCell>
                <TableCell>75</TableCell>
                <TableCell className="font-semibold">15,000</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
