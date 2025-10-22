
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, TrendingUp, Users, ShoppingCart, Calendar, IndianRupee } from 'lucide-react';
import QuickBilling from './QuickBilling';

const DailyBillingDashboard = () => {
  const { getAll } = useDatabase();

  // Fetch today's data
  const { data: todayInvoices = [] } = useQuery({
    queryKey: ['today-invoices'],
    queryFn: async () => {
      const invoices = await getAll('invoices');
      const today = new Date().toDateString();
      return invoices.filter((inv: any) => 
        new Date(inv.invoice_date).toDateString() === today
      );
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  // Calculate today's metrics
  const todayMetrics = {
    totalSales: todayInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
    totalInvoices: todayInvoices.length,
    cashSales: todayInvoices.filter((inv: any) => inv.payment_method === 'cash').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
    cardUpiSales: todayInvoices.filter((inv: any) => ['card', 'upi'].includes(inv.payment_method)).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
    averageTicket: todayInvoices.length > 0 ? (todayInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) / todayInvoices.length) : 0
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daily Billing</h2>
          <p className="text-muted-foreground">
            Quick billing and today's sales overview
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date().toLocaleDateString('en-IN')}
        </Badge>
      </div>

      {/* Today's Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayMetrics.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayMetrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Bills generated today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Ticket</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayMetrics.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayMetrics.cashSales)}</div>
            <p className="text-xs text-muted-foreground">
              Cash payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Digital Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayMetrics.cardUpiSales)}</div>
            <p className="text-xs text-muted-foreground">
              Card/UPI payments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="billing">Quick Billing</TabsTrigger>
          <TabsTrigger value="today-sales">Today's Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-6">
          <QuickBilling />
        </TabsContent>

        <TabsContent value="today-sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {todayInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales today yet</p>
                  <p className="text-sm">Start billing to see today's transactions</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayInvoices.map((invoice: any) => {
                      const customer = customers.find((c: any) => c.id === invoice.customer_id);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{new Date(invoice.created_at).toLocaleTimeString('en-IN')}</TableCell>
                          <TableCell>
                            {customer ? `${customer.first_name} ${customer.last_name}` : 'Walk-in'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invoice.payment_method?.toUpperCase() || 'CASH'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.payment_status?.toUpperCase() || 'PAID'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyBillingDashboard;
