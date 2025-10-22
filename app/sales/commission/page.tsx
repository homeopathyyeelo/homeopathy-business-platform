"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export default function SalesCommissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Salesman Commission
        </h1>
        <p className="text-muted-foreground">Track sales team performance and commissions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Commission</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">45,000</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Payout</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">12,500</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Salesmen</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">8</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Commission Report</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Salesman</TableHead>
                <TableHead>Sales Count</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Commission Earned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Rajesh Kumar</TableCell>
                <TableCell>45</TableCell>
                <TableCell>2,50,000</TableCell>
                <TableCell>2%</TableCell>
                <TableCell className="font-semibold text-green-600">5,000</TableCell>
                <TableCell><Badge>Paid</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
