'use client';

import { X, TrendingUp, TrendingDown, AlertCircle, Sparkles, Clock, CheckSquare, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface FinalRightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FinalRightPanel({ isOpen, onClose }: FinalRightPanelProps) {
  const [activeTab, setActiveTab] = useState<'kpis' | 'alerts' | 'activity' | 'todo'>('kpis');

  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-gradient-to-b from-blue-50 to-indigo-50 border-l border-blue-200 flex flex-col shadow-xl">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-blue-200 bg-white/50">
        <h2 className="font-bold text-lg text-gray-800">Quick Insights</h2>
        <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-blue-200 bg-white/50">
        {[
          { id: 'kpis', label: 'KPIs', icon: TrendingUp },
          { id: 'alerts', label: 'Alerts', icon: AlertCircle },
          { id: 'activity', label: 'Activity', icon: Clock },
          { id: 'todo', label: 'To-Do', icon: CheckSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'kpis' && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Today's Performance
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Sales', value: '₹45,000', trend: '+12%', color: 'green' },
                  { label: 'Orders', value: '24', trend: '+8%', color: 'blue' },
                  { label: 'Profit', value: '₹12,500', trend: '+15%', color: 'purple' },
                  { label: 'Outstanding', value: '₹85,000', trend: '-5%', color: 'orange' },
                ].map((kpi, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{kpi.label}</span>
                      <span className={`text-lg font-bold text-${kpi.color}-600`}>{kpi.value}</span>
                    </div>
                    <div className={`mt-2 flex items-center gap-1 text-xs text-${kpi.color}-600`}>
                      {kpi.trend.startsWith('+') ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{kpi.trend} from yesterday</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
          </>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {[
              { type: 'error', title: '3 items expiring soon', desc: 'Take action within 7 days', color: 'red' },
              { type: 'warning', title: '5 products low stock', desc: 'Reorder recommended', color: 'orange' },
              { type: 'info', title: '12 pending payments', desc: 'Total: ₹1,25,000', color: 'blue' },
            ].map((alert, index) => (
              <div key={index} className={`bg-${alert.color}-50 rounded-lg p-4 border border-${alert.color}-200`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`h-5 w-5 text-${alert.color}-600 mt-0.5`} />
                  <div className="flex-1">
                    <p className={`text-sm text-${alert.color}-700 font-medium`}>{alert.title}</p>
                    <p className={`text-xs text-${alert.color}-600 mt-1`}>{alert.desc}</p>
                    <button className={`mt-2 text-xs text-${alert.color}-600 font-medium hover:underline`}>
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-2">
            {[
              { action: 'New sale', detail: 'Invoice #INV-2025-001', time: '2 mins ago', color: 'green' },
              { action: 'Stock updated', detail: 'Batch #B2025-123', time: '15 mins ago', color: 'blue' },
              { action: 'Payment received', detail: '₹8,500', time: '1 hour ago', color: 'purple' },
              { action: 'New customer', detail: 'Rajesh Kumar', time: '2 hours ago', color: 'cyan' },
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
        )}

        {activeTab === 'todo' && (
          <div className="space-y-3">
            {[
              { task: 'Review pending purchase orders', priority: 'high', done: false },
              { task: 'Follow up with 3 customers', priority: 'medium', done: false },
              { task: 'Check expiry alerts', priority: 'high', done: true },
              { task: 'Update price list', priority: 'low', done: false },
            ].map((todo, index) => (
              <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {todo.task}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                      todo.priority === 'high' ? 'bg-red-100 text-red-600' :
                      todo.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {todo.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-blue-200 bg-white/50">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Ask AI Assistant</span>
        </button>
      </div>
    </aside>
  );
}
