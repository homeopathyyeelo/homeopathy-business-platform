"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download } from "lucide-react";

export default function ExpiryReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            Expiry Reports
          </h1>
          <p className="text-muted-foreground">Track expiring and expired products</p>
        </div>
        <Button><Download className="h-4 w-4 mr-2" />Export Report</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expired</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">12</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expiring in 30 Days</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">28</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expiring in 90 Days</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">45</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Expiry Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Sample Medicine</TableCell>
                <TableCell className="font-mono">BATCH001</TableCell>
                <TableCell>50</TableCell>
                <TableCell>2025-01-15</TableCell>
                <TableCell>85</TableCell>
                <TableCell><Badge variant="destructive">Critical</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
