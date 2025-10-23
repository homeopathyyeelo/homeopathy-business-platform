"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Eye } from "lucide-react";
import { useSalesPayments } from "@/lib/hooks/use-sales";

export default function SalesPaymentsPage() {
  const { payments, isLoading } = useSalesPayments();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Payment Collection
          </h1>
          <p className="text-muted-foreground">Manage customer payments</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments || []).map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono">{payment.receiptNumber}</TableCell>
                  <TableCell>{payment.customerName}</TableCell>
                  <TableCell className="font-semibold">{payment.amount?.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{payment.method}</Badge></TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge>{payment.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
