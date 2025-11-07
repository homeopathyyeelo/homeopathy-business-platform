'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/api-client-central';

export default function SalesInsightsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/ai/sales-insights')
      .then(data => {
        setData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading sales insights:', err);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'name', title: 'Name', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'createdAt', title: 'Created', sortable: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Sales Insights</h1>
        <p className="text-gray-600">AI analytics</p>
      </div>

      <DataTable
        title="Sales Insights"
        columns={columns}
        data={data}
        loading={loading}
        onAdd={() => console.log('Add new')}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
        onView={(row) => console.log('View', row)}
      />
    </div>
  );
}
