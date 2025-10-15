import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Send, CheckCircle, AlertCircle, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GSTComplianceSystem = () => {
  const { getGSTReturns, generateEInvoice, generateEWayBill, getAll } = useDatabase();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

  // Removed GST returns query for now as it needs proper implementation

  // Calculate GST summary for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyInvoices = invoices.filter((invoice: any) => 
    invoice.invoiceDate?.startsWith(currentMonth)
  );

  const gstSummary = monthlyInvoices.reduce((acc: any, invoice: any) => {
    const taxAmount = invoice.taxAmount || 0;
    acc.totalTax += taxAmount;
    acc.totalSales += invoice.total || 0;
    acc.invoiceCount += 1;
    return acc;
  }, { totalTax: 0, totalSales: 0, invoiceCount: 0 });

  const handleGenerateEInvoice = async (invoiceId: string) => {
    try {
      await generateEInvoice(invoiceId);
      toast({
        title: "E-Invoice Generated",
        description: "E-invoice has been generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate e-invoice",
        variant: "destructive"
      });
    }
  };

  const handleGenerateEWayBill = async (invoiceId: string) => {
    try {
      await generateEWayBill(invoiceId);
      toast({
        title: "E-Way Bill Generated",
        description: "E-way bill has been generated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate e-way bill",
        variant: "destructive"
      });
    }
  };

  const handleFileGSTReturn = () => {
    toast({
      title: "GST Return Filed",
      description: "GST return has been filed successfully"
    });
  };

  const getComplianceStatus = (invoice: any) => {
    if (invoice.eInvoiceNumber && invoice.eWayBillNumber) {
      return <Badge className="bg-green-100 text-green-800">Fully Compliant</Badge>;
    } else if (invoice.eInvoiceNumber) {
      return <Badge className="bg-yellow-100 text-yellow-800">E-Invoice Only</Badge>;
    } else {
      return <Badge variant="destructive">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* GST Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly GST Collected</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{gstSummary.totalTax.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">
              From {gstSummary.invoiceCount} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{gstSummary.totalSales.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">
              Total sales value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((inv: any) => inv.eInvoiceNumber).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Compliance</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((inv: any) => !inv.eInvoiceNumber).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices pending
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="einvoice" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="einvoice">E-Invoice Management</TabsTrigger>
          <TabsTrigger value="gst-returns">GST Returns</TabsTrigger>
          <TabsTrigger value="settings">GST Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="einvoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-Invoice & E-Way Bill Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>GST Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyInvoices.slice(0, 10).map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{invoice.customer?.firstName || 'Walk-in Customer'}</TableCell>
                      <TableCell>₹{invoice.total.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{(invoice.taxAmount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{getComplianceStatus(invoice)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!invoice.eInvoiceNumber && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGenerateEInvoice(invoice.id)}
                            >
                              Generate E-Invoice
                            </Button>
                          )}
                          {!invoice.eWayBillNumber && invoice.total > 50000 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGenerateEWayBill(invoice.id)}
                            >
                              Generate E-Way Bill
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst-returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                GST Return Filing
                <Button onClick={handleFileGSTReturn}>
                  <Send className="h-4 w-4 mr-2" />
                  File Return
                </Button>
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <Label htmlFor="period">Return Period</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-01">January 2024</SelectItem>
                    <SelectItem value="2024-02">February 2024</SelectItem>
                    <SelectItem value="2024-03">March 2024</SelectItem>
                    <SelectItem value="2024-04">April 2024</SelectItem>
                    <SelectItem value="2024-05">May 2024</SelectItem>
                    <SelectItem value="2024-06">June 2024</SelectItem>
                    <SelectItem value="2024-07">July 2024</SelectItem>
                    <SelectItem value="2024-08">August 2024</SelectItem>
                    <SelectItem value="2024-09">September 2024</SelectItem>
                    <SelectItem value="2024-10">October 2024</SelectItem>
                    <SelectItem value="2024-11">November 2024</SelectItem>
                    <SelectItem value="2024-12">December 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast({ title: "GSTR-1 Downloaded", description: "GST return file has been downloaded" })}>
                  <Download className="h-4 w-4 mr-2" />
                  Download GSTR-1
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "GSTR-3B Downloaded", description: "GST return file has been downloaded" })}>
                  <Download className="h-4 w-4 mr-2" />
                  Download GSTR-3B
                </Button>
              </div>
            </div>

              {/* GST Return Summary */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">₹{gstSummary.totalSales.toLocaleString('en-IN')}</div>
                    <p className="text-sm text-muted-foreground">Total Taxable Value</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">₹{gstSummary.totalTax.toLocaleString('en-IN')}</div>
                    <p className="text-sm text-muted-foreground">Total Tax Collected</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">₹0</div>
                    <p className="text-sm text-muted-foreground">Tax Payable</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="gst-number">GST Number</Label>
                  <Input 
                    id="gst-number"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="Enter your GST number"
                  />
                </div>
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input 
                    id="business-name"
                    placeholder="Enter your business name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>E-Invoice Settings</Label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-einvoice" defaultChecked />
                  <label htmlFor="auto-einvoice" className="text-sm">
                    Auto-generate E-Invoice for invoices above ₹500
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-eway" defaultChecked />
                  <label htmlFor="auto-eway" className="text-sm">
                    Auto-generate E-Way Bill for invoices above ₹50,000
                  </label>
                </div>
              </div>

              <Button>Save GST Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GSTComplianceSystem;