import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, Package2, Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ExpiryAlertSystem = () => {
  const { getSoonToExpireItems, getAll } = useDatabase();
  const { toast } = useToast();
  const [alertDays, setAlertDays] = useState(90);
  const [filterCategory, setFilterCategory] = useState('');

  const { data: expiringItems = [] } = useQuery({
    queryKey: ['expiring-items', alertDays],
    queryFn: () => getSoonToExpireItems(alertDays)
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getAll('categories')
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getAll('products')
  });

  // Filter items by category if selected
  const filteredItems = filterCategory 
    ? expiringItems.filter(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.categoryId === filterCategory;
      })
    : expiringItems;

  // Group items by urgency
  const criticalItems = filteredItems.filter(item => {
    const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 30;
  });

  const warningItems = filteredItems.filter(item => {
    const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry > 30 && daysToExpiry <= 60;
  });

  const normalItems = filteredItems.filter(item => {
    const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry > 60;
  });

  const getUrgencyBadge = (expiryDate: string) => {
    const daysToExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToExpiry <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysToExpiry <= 30) {
      return <Badge variant="destructive">Critical ({daysToExpiry} days)</Badge>;
    } else if (daysToExpiry <= 60) {
      return <Badge className="bg-orange-100 text-orange-800">Warning ({daysToExpiry} days)</Badge>;
    } else {
      return <Badge variant="outline">Normal ({daysToExpiry} days)</Badge>;
    }
  };

  const handleMarkAsNotified = (itemId: string) => {
    toast({
      title: "Notification Sent",
      description: "Expiry alert has been marked as notified"
    });
  };

  const handleCreateReminder = () => {
    toast({
      title: "Reminders Created",
      description: "Automatic reminders set for critical items"
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{criticalItems.length}</div>
            <p className="text-xs text-red-700">
              Expires within 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Warning</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{warningItems.length}</div>
            <p className="text-xs text-orange-700">
              Expires within 60 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Normal</CardTitle>
            <Package2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{normalItems.length}</div>
            <p className="text-xs text-blue-700">
              Good stock levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Expiry Alert Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Alert Days:</label>
              <Select value={alertDays.toString()} onValueChange={(value) => setAlertDays(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="120">120 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Category:</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateReminder} className="ml-auto">
              <Bell className="h-4 w-4 mr-2" />
              Set Reminders
            </Button>
          </div>

          {/* Expiring Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Stock Quantity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Value at Risk</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No items expiring within {alertDays} days
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => {
                  const product = products.find(p => p.id === item.productId);
                  const valueAtRisk = (item.quantityInStock || 0) * (item.purchasePrice || 0);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{product?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{product?.fullMedicineName}</div>
                      </TableCell>
                      <TableCell>{item.batchNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.quantityInStock <= 10 ? "destructive" : "outline"}>
                          {item.quantityInStock || 0} units
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getUrgencyBadge(item.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₹{valueAtRisk.toLocaleString('en-IN')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMarkAsNotified(item.id)}
                          >
                            <BellOff className="h-3 w-3 mr-1" />
                            Mark Notified
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpiryAlertSystem;