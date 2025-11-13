'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api/fetch-utils';
import { apiFetch } from '@/lib/utils/api-fetch';

export default function DoctorDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/prescriptions/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-gray-600">KPIs for prescriptions, follow-ups, and outcomes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border bg-white p-4">
          <div className="text-sm text-gray-600">Today's Prescriptions</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.todayPrescriptions || 0}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-sm text-gray-600">This Week</div>
          <div className="text-3xl font-bold text-green-600">{stats?.weekPrescriptions || 0}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-sm text-gray-600">Pending Follow-ups</div>
          <div className="text-3xl font-bold text-orange-600">{stats?.pendingFollowups || 0}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-sm text-gray-600">Patient Satisfaction</div>
          <div className="text-3xl font-bold text-purple-600">{stats?.avgRating || 0}/5</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border bg-white p-4">
          <h3 className="font-semibold mb-3">Top Prescribed Medicines</h3>
          <div className="space-y-2">
            {(stats?.topMedicines || []).map((m: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{m.name}</span>
                <span className="text-gray-600">{m.count} times</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-white p-4">
          <h3 className="font-semibold mb-3">Common Diagnoses</h3>
          <div className="space-y-2">
            {(stats?.topDiagnoses || []).map((d: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{d.name}</span>
                <span className="text-gray-600">{d.count} cases</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white p-4">
        <h3 className="font-semibold mb-3">Recent Prescriptions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Patient</th>
                <th className="p-2 text-left">Diagnosis</th>
                <th className="p-2 text-left">Medicines</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentPrescriptions || []).map((p: any) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.date}</td>
                  <td className="p-2">{p.patient}</td>
                  <td className="p-2">{p.diagnosis}</td>
                  <td className="p-2">{p.medicineCount} items</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
