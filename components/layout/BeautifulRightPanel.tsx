'use client';

import { X, TrendingUp, TrendingDown, AlertCircle, Sparkles, Clock } from 'lucide-react';

interface BeautifulRightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BeautifulRightPanel({ isOpen, onClose }: BeautifulRightPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-gradient-to-b from-blue-50 to-indigo-50 border-l border-blue-200 flex flex-col shadow-xl">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-blue-200 bg-white/50">
        <h2 className="font-bold text-lg text-gray-800">Quick Insights</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Today's KPIs */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Today's Performance
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sales</span>
                <span className="text-lg font-bold text-green-600">₹45,000</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+12% from yesterday</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Orders</span>
                <span className="text-lg font-bold text-blue-600">24</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                <TrendingUp className="h-3 w-3" />
                <span>+8% from yesterday</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profit</span>
                <span className="text-lg font-bold text-purple-600">₹12,500</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                <TrendingUp className="h-3 w-3" />
                <span>+15% margin</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            AI Insights
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 font-medium">Low Stock Alert</p>
              <p className="text-xs text-gray-600 mt-1">5 products need reordering</p>
              <button className="mt-2 text-xs text-purple-600 font-medium hover:underline">
                View Details →
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-700 font-medium">Top Seller</p>
              <p className="text-xs text-gray-600 mt-1">Arnica 30C - 45 units sold</p>
              <button className="mt-2 text-xs text-blue-600 font-medium hover:underline">
                View Report →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {[
              { action: 'New sale', detail: 'Invoice #INV-2025-001', time: '2 mins ago', color: 'green' },
              { action: 'Stock updated', detail: 'Batch #B2025-123', time: '15 mins ago', color: 'blue' },
              { action: 'Payment received', detail: '₹8,500', time: '1 hour ago', color: 'purple' },
            ].map((activity, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${activity.color}-500 mt-1.5`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Alerts
          </h3>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-700 font-medium">3 items expiring soon</p>
            <p className="text-xs text-red-600 mt-1">Take action within 7 days</p>
            <button className="mt-2 text-xs text-red-600 font-medium hover:underline">
              View Expiry Report →
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
