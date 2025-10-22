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
import { Plus, Search, Eye, TrendingUp, DollarSign, Package } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useVendors } from "@/lib/hooks/vendors";
import { formatCurrency } from "@/lib/utils";

interface PurchaseRecord {
  id: string;
  vendor_id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  total_items: number;
  status: 'pending' | 'received' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
}

export default function VendorPurchaseHistoryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Use React Query hooks
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors();

  // Mock purchase history data
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([
    {
      id: '1',
      vendor_id: '1',
      vendor_name: 'ABC Pharmaceuticals',
      invoice_number: 'INV-2024-001',
      invoice_date: '2024-01-15',
      total_amount: 150000,
      total_items: 25,
      status: 'received',
      payment_status: 'paid',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      vendor_id: '2',
      vendor_name: 'XYZ Distributors',
      invoice_number: 'INV-2024-002',
      invoice_date: '2024-01-20',
      total_amount: 87500,
      total_items: 15,
      status: 'received',
      payment_status: 'partial',
      created_at: '2024-01-20T14:15:00Z'
    },
    {
      id: '3',
      vendor_id: '1',
      vendor_name: 'ABC Pharmaceuticals',
      invoice_number: 'INV-2024-003',
      invoice_date: '2024-01-25',
      total_amount: 225000,
      total_items: 35,
      status: 'pending',
      payment_status: 'unpaid',
      created_at: '2024-01-25T09:45:00Z'
    }
  ]);

  // Filter purchase history based on search term and filters
  const filteredHistory = purchaseHistory.filter((record: PurchaseRecord) => {
    const matchesSearch =
      record.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendor = selectedVendor === "all" || record.vendor_id === selectedVendor;
    const matchesStatus = selectedStatus === "all" || record.status === selectedStatus;

    return matchesSearch && matchesVendor && matchesStatus;
  });

  // Calculate stats
  const totalPurchases = purchaseHistory.length;
  const totalAmount = purchaseHistory.reduce((sum, record) => sum + record.total_amount, 0);
  const pendingPayments = purchaseHistory
    .filter(record => record.payment_status === 'unpaid' || record.payment_status === 'partial')
    .reduce((sum, record) => sum + record.total_amount, 0);
  const receivedItems = purchaseHistory
    .filter(record => record.status === 'received')
    .reduce((sum, record) => sum + record.total_items, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Purchase History</h2>
        <Button className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          New Purchase
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pendingPayments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{receivedItems}</div>
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((record: PurchaseRecord) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.invoice_number}</TableCell>
                  <TableCell>{record.vendor_name}</TableCell>
                  <TableCell>{new Date(record.invoice_date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.total_items}</TableCell>
                  <TableCell>{record.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      record.status === 'received' ? 'default' :
                      record.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      record.payment_status === 'paid' ? 'default' :
                      record.payment_status === 'partial' ? 'secondary' : 'destructive'
                    }>
                      {record.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
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
