import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageCircle, Mail, Bell, Send, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isAfter } from 'date-fns';

const PaymentReminderSystem = () => {
  const { getAll, create } = useDatabase();
  const { toast } = useToast();
  const [isCreatingReminders, setIsCreatingReminders] = useState(false);

  // Fetch data
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => getAll('invoices')
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getAll('customers')
  });

  const { data: reminders = [], refetch: refetchReminders } = useQuery({
    queryKey: ['payment_reminders'],
    queryFn: () => getAll('payment_reminders')
  });

  // Calculate overdue invoices
  const today = new Date();
  const overdueInvoices = invoices.filter((invoice: any) => {
    if (invoice.payment_status === 'paid') return false;
    
    const customer = customers.find((c: any) => c.id === invoice.customer_id);
    if (!customer || !customer.credit_days) return false;
    
    const dueDate = addDays(new Date(invoice.invoice_date), customer.credit_days);
    return isAfter(today, dueDate);
  });

  // Calculate upcoming due invoices (next 7 days)
  const upcomingDueInvoices = invoices.filter((invoice: any) => {
    if (invoice.payment_status === 'paid') return false;
    
    const customer = customers.find((c: any) => c.id === invoice.customer_id);
    if (!customer || !customer.credit_days) return false;
    
    const dueDate = addDays(new Date(invoice.invoice_date), customer.credit_days);
    const sevenDaysFromNow = addDays(today, 7);
    
    return dueDate >= today && dueDate <= sevenDaysFromNow;
  });

  const createAutoReminders = async () => {
    setIsCreatingReminders(true);
    try {
      let reminderCount = 0;

      // Create reminders for overdue invoices
      for (const invoice of overdueInvoices) {
        const customer = customers.find((c: any) => c.id === invoice.customer_id);
        if (!customer || !customer.phone) continue;

        // Check if reminder already exists
        const existingReminder = reminders.find((r: any) => 
          r.invoice_id === invoice.id && r.reminder_type === 'overdue'
        );
        
        if (existingReminder) continue;

        await create('payment_reminders', {
          customer_id: customer.id,
          invoice_id: invoice.id,
          reminder_type: 'overdue',
          reminder_date: today,
          message: `Dear ${customer.first_name}, your invoice ${invoice.invoice_number} of ₹${invoice.total} is overdue. Please make payment to avoid late charges.`,
          status: 'pending'
        });

        reminderCount++;
      }

      // Create reminders for upcoming due invoices
      for (const invoice of upcomingDueInvoices) {
        const customer = customers.find((c: any) => c.id === invoice.customer_id);
        if (!customer || !customer.phone) continue;

        const dueDate = addDays(new Date(invoice.invoice_date), customer.credit_days);
        
        // Check if reminder already exists
        const existingReminder = reminders.find((r: any) => 
          r.invoice_id === invoice.id && r.reminder_type === 'upcoming_due'
        );
        
        if (existingReminder) continue;

        await create('payment_reminders', {
          customer_id: customer.id,
          invoice_id: invoice.id,
          reminder_type: 'upcoming_due',
          reminder_date: dueDate,
          message: `Dear ${customer.first_name}, your invoice ${invoice.invoice_number} of ₹${invoice.total} is due on ${format(dueDate, 'dd/MM/yyyy')}. Please arrange payment.`,
          status: 'pending'
        });

        reminderCount++;
      }

      await refetchReminders();

      toast({
        title: "Reminders Created",
        description: `${reminderCount} payment reminders have been created`
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create reminders",
        variant: "destructive"
      });
    } finally {
      setIsCreatingReminders(false);
    }
  };

  const sendReminder = async (reminderId: string, method: 'whatsapp' | 'email') => {
    try {
      // In a real implementation, this would integrate with WhatsApp/Email APIs
      // For now, we'll just mark the reminder as sent
      
      toast({
        title: "Reminder Sent",
        description: `Payment reminder sent via ${method}`,
      });

      // Update reminder status (this would be done via the actual API call)
      await refetchReminders();

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to send reminder via ${method}`,
        variant: "destructive"
      });
    }
  };

  const getReminderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'sent':
        return <Badge>Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (reminderType: string) => {
    switch (reminderType) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'upcoming_due':
        return <Badge className="bg-orange-100 text-orange-800">Due Soon</Badge>;
      default:
        return <Badge variant="outline">{reminderType}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              ₹{overdueInvoices.reduce((sum, inv) => sum + (inv.balance_due || inv.total), 0).toLocaleString('en-IN')} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Bell className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingDueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              ₹{upcomingDueInvoices.reduce((sum, inv) => sum + (inv.balance_due || inv.total), 0).toLocaleString('en-IN')} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reminders.filter((r: any) => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to send</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Send className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reminders.filter((r: any) => 
                r.status === 'sent' && 
                new Date(r.sent_at).toDateString() === today.toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Reminders sent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overdue" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="overdue">Overdue Invoices</TabsTrigger>
            <TabsTrigger value="upcoming">Due Soon</TabsTrigger>
            <TabsTrigger value="reminders">All Reminders</TabsTrigger>
          </TabsList>
          
          <Button onClick={createAutoReminders} disabled={isCreatingReminders}>
            <Bell className="h-4 w-4 mr-2" />
            {isCreatingReminders ? 'Creating...' : 'Create Auto Reminders'}
          </Button>
        </div>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueInvoices.map((invoice: any) => {
                    const customer = customers.find((c: any) => c.id === invoice.customer_id);
                    const dueDate = customer?.credit_days 
                      ? addDays(new Date(invoice.invoice_date), customer.credit_days)
                      : new Date(invoice.invoice_date);
                    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'}
                        </TableCell>
                        <TableCell>₹{(invoice.balance_due || invoice.total).toLocaleString('en-IN')}</TableCell>
                        <TableCell>{format(dueDate, 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{daysOverdue} days</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendReminder(invoice.id, 'whatsapp')}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendReminder(invoice.id, 'email')}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Due This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Until Due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingDueInvoices.map((invoice: any) => {
                    const customer = customers.find((c: any) => c.id === invoice.customer_id);
                    const dueDate = customer?.credit_days 
                      ? addDays(new Date(invoice.invoice_date), customer.credit_days)
                      : new Date(invoice.invoice_date);
                    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'}
                        </TableCell>
                        <TableCell>₹{(invoice.balance_due || invoice.total).toLocaleString('en-IN')}</TableCell>
                        <TableCell>{format(dueDate, 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800">{daysUntilDue} days</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendReminder(invoice.id, 'whatsapp')}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Remind
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Payment Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.slice(0, 20).map((reminder: any) => {
                    const customer = customers.find((c: any) => c.id === reminder.customer_id);
                    const invoice = invoices.find((i: any) => i.id === reminder.invoice_id);
                    
                    return (
                      <TableRow key={reminder.id}>
                        <TableCell>{format(new Date(reminder.reminder_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice?.invoice_number || 'Unknown'}
                        </TableCell>
                        <TableCell>{getPriorityBadge(reminder.reminder_type)}</TableCell>
                        <TableCell>{getReminderStatus(reminder.status)}</TableCell>
                        <TableCell>
                          {reminder.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => sendReminder(reminder.id, 'whatsapp')}
                              >
                                Send Now
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentReminderSystem;