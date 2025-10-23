"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, Trash2 } from "lucide-react";

export default function HoldBillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Pause className="h-8 w-8" />Hold Bills
          </h1>
          <p className="text-muted-foreground">Manage paused invoices</p>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>On Hold Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Hold Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">HOLD-001</TableCell>
                <TableCell>Walk-in Customer</TableCell>
                <TableCell className="font-semibold">2,500</TableCell>
                <TableCell>15 mins ago</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm"><Play className="h-4 w-4 mr-1" />Resume</Button>
                    <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
