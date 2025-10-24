'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

export default function StockListPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await api.inventory.getAll();
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stock data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'product_name', title: 'Product', sortable: true },
    { key: 'batch_no', title: 'Batch No', sortable: true },
    { key: 'quantity', title: 'Quantity', sortable: true },
    { key: 'available', title: 'Available', sortable: true },
    { key: 'shop_name', title: 'Shop', sortable: true },
    { key: 'expiry_date', title: 'Expiry', sortable: true },
    { key: 'mrp', title: 'MRP', sortable: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock List</h1>
          <p className="text-gray-600">All stock</p>
        </div>
      </div>

      <DataTable
        title="Stock List"
        columns={columns}
        data={data}
        loading={loading}
        onAdd={() => console.log('Add')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
