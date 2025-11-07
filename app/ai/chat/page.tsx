'use client';

import DataTable from '@/components/common/DataTable';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/api/fetch-utils';

export default function AIChatPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/chat')
      .then(res => res.json())
      .then(data => {
        setData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <p className="text-gray-600">Business assistant</p>
      </div>

      <DataTable
        title="AI Chat"
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
