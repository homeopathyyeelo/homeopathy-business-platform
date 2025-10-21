'use client';

import { useState } from 'react';
import {
  X,
  Filter,
  Calendar,
  Tag,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Activity,
} from 'lucide-react';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RightPanel({ isOpen, onClose }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'filters' | 'ai' | 'activity'>('filters');

  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-lg">Quick Access</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'filters'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Filter className="h-4 w-4 mx-auto mb-1" />
          Filters
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'ai'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Sparkles className="h-4 w-4 mx-auto mb-1" />
          AI
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'activity'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Activity className="h-4 w-4 mx-auto mb-1" />
          Activity
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'filters' && <FiltersTab />}
        {activeTab === 'ai' && <AITab />}
        {activeTab === 'activity' && <ActivityTab />}
      </div>
    </aside>
  );
}

function FiltersTab() {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Today
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            This Week
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            This Month
          </button>
          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Custom
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
          Status
        </label>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Active
          </button>
          <button className="w-full px-3 py-2 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Pending
          </button>
          <button className="w-full px-3 py-2 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Expired
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50">
            Dilutions
          </span>
          <span className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50">
            Tinctures
          </span>
          <span className="px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50">
            Biochemic
          </span>
        </div>
      </div>
    </div>
  );
}

function AITab() {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Reorder Suggestion
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Medicine "Arnica 30C" is running low. Suggested reorder: 50 units
            </p>
            <button className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Create PO
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Campaign Idea
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Send seasonal promotion to patients who bought immunity medicines
            </p>
            <button className="mt-2 px-3 py-1 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
              Generate Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Sales Insight
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              Sales increased 15% this week. Top category: Respiratory medicines
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Invoice #INV-1234 created</p>
          <p className="text-xs text-gray-500">Patient: John Doe</p>
          <p className="text-xs text-gray-400">2 minutes ago</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Stock adjusted</p>
          <p className="text-xs text-gray-500">Medicine: Arnica 30C (+20 units)</p>
          <p className="text-xs text-gray-400">15 minutes ago</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Campaign sent</p>
          <p className="text-xs text-gray-500">150 messages delivered</p>
          <p className="text-xs text-gray-400">1 hour ago</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Purchase order approved</p>
          <p className="text-xs text-gray-500">PO #PO-5678</p>
          <p className="text-xs text-gray-400">3 hours ago</p>
        </div>
      </div>
    </div>
  );
}
