
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { golangAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Delivery {
  id: string;
  order_id: string;
  order_type: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  assigned_to: string;
  assigned_to_name: string;
  delivery_status: string;
  delivery_date: string;
  estimated_delivery_time: string;
  actual_delivery_time: string;
  notes: string;
  payment_collected: boolean;
  payment_amount: number;
  created_at: string;
  updated_at: string;
}

interface DeliveryStaff {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  current_status: string;
  completed_deliveries: number;
  rating: number;
}

const DeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryStaff[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const { toast } = useToast();

  const [newDelivery, setNewDelivery] = useState({
    order_id: "",
    order_type: "retail",
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    assigned_to: "",
    delivery_status: "pending",
    delivery_date: "",
    notes: "",
    payment_amount: 0
  });

  useEffect(() => {
    fetchDeliveries();
    fetchDeliveryStaff();
    fetchCustomers();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_staff')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setDeliveryStaff(data || []);
    } catch (error) {
      console.error('Error fetching delivery staff:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateDelivery = async () => {
    try {
      const selectedCustomer = customers.find(c => c.id === newDelivery.customer_id);
      const selectedStaff = deliveryStaff.find(s => s.id === newDelivery.assigned_to);

      const deliveryData = {
        ...newDelivery,
        order_id: newDelivery.order_id || `ORD-${Date.now()}`,
        customer_name: selectedCustomer?.first_name + ' ' + (selectedCustomer?.last_name || ''),
        customer_phone: selectedCustomer?.phone,
        customer_address: selectedCustomer?.address,
        assigned_to_name: selectedStaff?.name,
      };

      const { data, error } = await supabase
        .from('deliveries')
        .insert([deliveryData])
        .select();

      if (error) throw error;

      setDeliveries([data[0], ...deliveries]);
      setIsCreateDialogOpen(false);
      setNewDelivery({
        order_id: "",
        order_type: "retail",
        customer_id: "",
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        assigned_to: "",
        delivery_status: "pending",
        delivery_date: "",
        notes: "",
        payment_amount: 0
      });

      toast({
        title: "Success",
        description: "Delivery created successfully",
      });
    } catch (error) {
      console.error('Error creating delivery:', error);
      toast({
        title: "Error",
        description: "Failed to create delivery",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .update({ 
          delivery_status: status,
          actual_delivery_time: status === 'delivered' ? new Date().toISOString() : null
        })
        .eq('id', deliveryId)
        .select();

      if (error) throw error;

      setDeliveries(deliveries.map(d => 
        d.id === deliveryId ? { ...d, delivery_status: status } : d
      ));

      toast({
        title: "Success",
        description: `Delivery status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'in_transit': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.customer_phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Delivery Management</h2>
          <p className="text-muted-foreground">
            Track and manage customer deliveries and orders.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Delivery</DialogTitle>
              <DialogDescription>
                Add a new delivery order to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order_id">Order ID</Label>
                  <Input
                    id="order_id"
                    value={newDelivery.order_id}
                    onChange={(e) => setNewDelivery({...newDelivery, order_id: e.target.value})}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <Label htmlFor="order_type">Order Type</Label>
                  <Select value={newDelivery.order_type} onValueChange={(value) => setNewDelivery({...newDelivery, order_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="customer_id">Customer</Label>
                <Select value={newDelivery.customer_id} onValueChange={(value) => setNewDelivery({...newDelivery, customer_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned_to">Assign to Staff</Label>
                <Select value={newDelivery.assigned_to} onValueChange={(value) => setNewDelivery({...newDelivery, assigned_to: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.current_status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={newDelivery.delivery_date}
                  onChange={(e) => setNewDelivery({...newDelivery, delivery_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="payment_amount">Payment Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  value={newDelivery.payment_amount}
                  onChange={(e) => setNewDelivery({...newDelivery, payment_amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newDelivery.notes}
                  onChange={(e) => setNewDelivery({...newDelivery, notes: e.target.value})}
                  placeholder="Additional delivery notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDelivery}>Create Delivery</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="deliveries" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deliveries">All Deliveries</TabsTrigger>
          <TabsTrigger value="staff">Delivery Staff</TabsTrigger>
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliveries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredDeliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Order: {delivery.order_id}</h3>
                        <Badge className={getStatusBadgeColor(delivery.delivery_status)}>
                          {delivery.delivery_status}
                        </Badge>
                        <Badge variant="outline">{delivery.order_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {delivery.customer_name} | {delivery.customer_phone}
                      </p>
                      <p className="text-sm">{delivery.customer_address}</p>
                      {delivery.assigned_to_name && (
                        <p className="text-sm">Assigned to: {delivery.assigned_to_name}</p>
                      )}
                      {delivery.delivery_date && (
                        <p className="text-sm">Delivery Date: {new Date(delivery.delivery_date).toLocaleDateString()}</p>
                      )}
                      {delivery.notes && (
                        <p className="text-sm text-muted-foreground">Notes: {delivery.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={delivery.delivery_status}
                        onValueChange={(status) => handleUpdateDeliveryStatus(delivery.id, status)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Staff</CardTitle>
              <CardDescription>Manage delivery personnel and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {deliveryStaff.map((staff) => (
                  <div key={staff.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{staff.name}</h4>
                      <p className="text-sm text-muted-foreground">{staff.phone}</p>
                      <p className="text-sm">Completed: {staff.completed_deliveries} deliveries</p>
                      <p className="text-sm">Rating: {staff.rating}/5.0</p>
                    </div>
                    <Badge className={staff.current_status === 'available' ? 'bg-green-500' : 'bg-red-500'}>
                      {staff.current_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Zones</CardTitle>
              <CardDescription>Configure delivery zones and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Delivery zones are configured in the database. Contact admin to modify zones.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryManagement;
