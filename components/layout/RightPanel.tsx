'use client';

import { X, TrendingUp, Sparkles, Clock } from 'lucide-react';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightPanel({ isOpen, onClose }: RightPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-gradient-to-b from-blue-50 to-indigo-50 border-l border-blue-200 flex flex-col shadow-xl">
      <div className="h-16 flex items-center justify-between px-6 border-b border-blue-200 bg-white/50">
        <h2 className="font-bold text-lg text-gray-800">Quick Insights</h2>
        <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-lg">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />Today Performance
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Sales', value: 'Rs 45000', trend: '+12%', color: 'green' },
              { label: 'Orders', value: '24', trend: '+8%', color: 'blue' },
              { label: 'Profit', value: 'Rs 12500', trend: '+15%', color: 'purple' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{kpi.label}</span>
                  <span className={`text-lg font-bold text-${kpi.color}-600`}>{kpi.value}</span>
                </div>
                <div className={`mt-2 flex items-center gap-1 text-xs text-${kpi.color}-600`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{kpi.trend} from yesterday</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />AI Insights
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 font-medium">Low Stock Alert</p>
              <p className="text-xs text-gray-600 mt-1">5 products need reordering</p>
              <button className="mt-2 text-xs text-purple-600 font-medium hover:underline">View Details</button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />Recent Activity
          </h3>
          <div className="space-y-2">
            {[
              { action: 'New sale', detail: 'Invoice INV-2025-001', time: '2 mins ago' },
              { action: 'Stock updated', detail: 'Batch B2025-123', time: '15 mins ago' },
            ].map((activity, i) => (
              <div key={i} className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <p className="text-sm font-medium text-gray-700">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.detail}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
