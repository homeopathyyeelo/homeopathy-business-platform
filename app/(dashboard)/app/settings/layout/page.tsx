'use client';

import { useState, useEffect } from 'react';
import { Monitor, Maximize2, Check } from 'lucide-react';
import { updateLayoutPreferences, type LayoutMode } from '@/components/layout/erp/ERPLayout';

export default function LayoutSettingsPage() {
  const [currentMode, setCurrentMode] = useState<LayoutMode>('full');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current preferences
    const saved = localStorage.getItem('erp-layout-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentMode(parsed.mode || 'full');
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }
  }, []);

  const handleLayoutChange = (mode: LayoutMode) => {
    setIsSaving(true);
    setCurrentMode(mode);
    
    // Save and reload
    setTimeout(() => {
      updateLayoutPreferences({ mode });
    }, 500);
  };

  const layouts = [
    {
      id: 'simple' as LayoutMode,
      name: 'Simple Layout',
      description: 'Clean layout with Top Bar and Left Sidebar only. Perfect for focused work.',
      icon: Monitor,
      features: [
        'Top navigation bar',
        'Left sidebar menu',
        'Maximum content space',
        'Minimal distractions',
      ],
      preview: '/images/layout-simple.png',
    },
    {
      id: 'full' as LayoutMode,
      name: 'Full Layout (4-Side)',
      description: 'Enterprise layout with Top, Left, Right, and Bottom panels. All features at your fingertips.',
      icon: Maximize2,
      features: [
        'Top navigation bar',
        'Left sidebar menu',
        'Right contextual panel (filters, AI, activity)',
        'Bottom status bar',
        'Maximum productivity',
      ],
      preview: '/images/layout-full.png',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Layout Preferences
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Choose your preferred layout style. Changes will take effect immediately.
        </p>
      </div>

      {/* Layout Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isSelected = currentMode === layout.id;

          return (
            <div
              key={layout.id}
              className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleLayoutChange(layout.id)}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                  <Check className="h-4 w-4" />
                  <span>Active</span>
                </div>
              )}

              {/* Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {layout.name}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {layout.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Features:
                </p>
                <ul className="space-y-1">
                  {layout.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-blue-600' : 'bg-gray-400'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preview Placeholder */}
              <div className="mt-4 aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Icon className="h-12 w-12 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Settings */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Additional Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Remember sidebar state
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep sidebar open/closed state across sessions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Show keyboard shortcuts
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Display keyboard shortcut hints in bottom bar
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Compact mode
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reduce padding and spacing for more content
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Tip:</strong> You can quickly toggle panels using keyboard shortcuts:
          <span className="block mt-2 font-mono text-xs">
            Ctrl+B - Toggle left sidebar | Ctrl+R - Toggle right panel | Ctrl+Shift+B - Toggle bottom bar
          </span>
        </p>
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Applying changes...</span>
        </div>
      )}
    </div>
  );
}
