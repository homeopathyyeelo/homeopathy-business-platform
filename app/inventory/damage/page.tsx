"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DataTable from "@/components/common/DataTable";
import { useToast } from "@/hooks/use-toast";

export default function DamagePage() {
  const { toast } = useToast();
  const [damages, setDamages] = useState([]);
  const [summary, setSummary] = useState({ total_quantity: 0, total_value: 0 });
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    batch_no: "",
    quantity: 0,
    reason: "expired",
    notes: ""
  });

  useEffect(() => {
    fetchDamages();
    fetchSummary();
  }, []);

  const fetchDamages = async () => {
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await fetch(`${API_URL}/api/erp/inventory/damages`);
    if (res.ok) {
      const data = await res.json();
      setDamages(data.data || []);
    }
  };

  const fetchSummary = async () => {
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await fetch(`${API_URL}/api/erp/inventory/damages/summary`);
    if (res.ok) {
      const data = await res.json();
      setSummary(data.data);
    }
  };

  const handleSubmit = async () => {
    const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
    const res = await fetch(`${API_URL}/api/erp/inventory/damages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      toast({ title: "Damage entry created" });
      setOpen(false);
      fetchDamages();
      fetchSummary();
    }
  };

  const columns = [
    { key: "product_name", title: "Product", sortable: true },
    { key: "batch_no", title: "Batch No" },
    { key: "quantity", title: "Quantity" },
    { key: "reason", title: "Reason" },
    { key: "notes", title: "Notes" },
    { 
      key: "damage_date", 
      title: "Date",
      render: (val: string) => new Date(val).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            Product Damage Report
          </h1>
          <p className="text-muted-foreground">Track damaged, expired and obsolete inventory</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Damage Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Damage Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product</label>
                <Input placeholder="Search product..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Batch No</label>
                <Input 
                  value={formData.batch_no}
                  onChange={(e) => setFormData({...formData, batch_no: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input 
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Select value={formData.reason} onValueChange={(val) => setFormData({...formData, reason: val})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="obsolete">Obsolete</SelectItem>
                    <SelectItem value="stolen">Stolen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_quantity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{summary.total_value?.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Damage Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={damages} />
        </CardContent>
      </Card>
    </div>
  );
}
