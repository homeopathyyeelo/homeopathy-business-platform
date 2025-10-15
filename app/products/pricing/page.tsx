'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';

export default function PriceManagementPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    setLoading(false);
  }, []);

  const columns = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'name', title: 'Name', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'created', title: 'Created', sortable: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Management</h1>
          <p className="text-gray-600">Manage pricing</p>
        </div>
      </div>

      <DataTable
        title="Price Management"
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
