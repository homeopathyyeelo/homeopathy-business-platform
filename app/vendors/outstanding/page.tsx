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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Search, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useVendors } from "@/lib/hooks/vendors";
import { formatCurrency } from "@/lib/utils";

interface OutstandingRecord {
  id: string;
  vendor_id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  status: 'current' | 'overdue' | 'critical';
}

export default function VendorOutstandingPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Use React Query hooks
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors();

  // Mock outstanding data
  const [outstandingRecords, setOutstandingRecords] = useState<OutstandingRecord[]>([
    {
      id: '1',
      vendor_id: '1',
      vendor_name: 'ABC Pharmaceuticals',
      invoice_number: 'INV-2024-001',
      invoice_date: '2024-01-15',
      due_date: '2024-02-14',
      amount: 150000,
      paid_amount: 50000,
      outstanding_amount: 100000,
      days_overdue: 15,
      status: 'overdue'
    },
    {
      id: '2',
      vendor_id: '2',
      vendor_name: 'XYZ Distributors',
      invoice_number: 'INV-2024-002',
      invoice_date: '2024-01-20',
      due_date: '2024-02-19',
      amount: 87500,
      paid_amount: 87500,
      outstanding_amount: 0,
      days_overdue: 0,
      status: 'current'
    },
    {
      id: '3',
      vendor_id: '1',
      vendor_name: 'ABC Pharmaceuticals',
      invoice_number: 'INV-2024-003',
      invoice_date: '2024-01-25',
      due_date: '2024-02-24',
      amount: 225000,
      paid_amount: 0,
      outstanding_amount: 225000,
      days_overdue: 5,
      status: 'critical'
    }
  ]);

  // Filter records based on search term and filters
  const filteredRecords = outstandingRecords.filter((record: OutstandingRecord) => {
    const matchesSearch =
      record.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendor = selectedVendor === "all" || record.vendor_id === selectedVendor;
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;

    return matchesSearch && matchesVendor && matchesStatus;
  });

  // Calculate stats
  const totalOutstanding = outstandingRecords.reduce((sum, record) => sum + record.outstanding_amount, 0);
  const overdueCount = outstandingRecords.filter(record => record.status === 'overdue' || record.status === 'critical').length;
  const criticalCount = outstandingRecords.filter(record => record.status === 'critical').length;
  const avgDaysOverdue = outstandingRecords
    .filter(record => record.days_overdue > 0)
    .reduce((sum, record, _, arr) => sum + record.days_overdue / arr.length, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Outstanding Ledger</h2>
        <Button variant="outline" className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          Payment Reminder
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOutstanding.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{criticalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Avg Days Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgDaysOverdue)} days</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by vendor or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>

        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((vendor: any) => (
              <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="current">Current</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record: OutstandingRecord) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.vendor_name}</TableCell>
                  <TableCell>{record.invoice_number}</TableCell>
                  <TableCell>{new Date(record.invoice_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(record.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.amount.toLocaleString()}</TableCell>
                  <TableCell>{record.paid_amount.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">
                    {record.outstanding_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {record.days_overdue > 0 ? (
                      <span className={`font-medium ${
                        record.days_overdue > 30 ? 'text-red-600' :
                        record.days_overdue > 15 ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                        {record.days_overdue} days
                      </span>
                    ) : (
                      <span className="text-green-600">On time</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      record.status === 'current' ? 'default' :
                      record.status === 'overdue' ? 'secondary' : 'destructive'
                    }>
                      {record.status}
                    </Badge>
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
