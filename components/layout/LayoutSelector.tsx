'use client';

import { useState, useEffect } from 'react';
import { LAYOUT_OPTIONS, LayoutType, DEFAULT_LAYOUT_PREFERENCES, type LayoutPreferences } from '@/lib/layout-config';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LayoutSelector() {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('ecommerce-mega');
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_LAYOUT_PREFERENCES);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('layout-preferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPreferences(parsed);
      setSelectedLayout(parsed.layoutType);
    }
  }, []);

  const handleSave = () => {
    const newPreferences = {
      ...preferences,
      layoutType: selectedLayout,
    };
    
    localStorage.setItem('layout-preferences', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    toast.success('Layout preferences saved! Refresh the page to see changes.');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Layout Preferences</h1>
      <p className="text-gray-600 mb-8">Choose your preferred dashboard layout and navigation style</p>

      {/* Layout Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {LAYOUT_OPTIONS.map((layout) => (
          <Card
            key={layout.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedLayout === layout.id
                ? 'ring-2 ring-blue-600 shadow-lg'
                : 'hover:ring-2 hover:ring-gray-300'
            }`}
            onClick={() => setSelectedLayout(layout.id as LayoutType)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{layout.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{layout.name}</CardTitle>
                  </div>
                </div>
                {selectedLayout === layout.id && (
                  <div className="bg-blue-600 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{layout.description}</p>
              
              {/* Preview placeholder */}
              <div className="mt-4 bg-gray-100 rounded-lg p-4 h-32 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Preview</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Show Left Sidebar</h4>
              <p className="text-sm text-gray-600">Display navigation sidebar on the left</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.showLeftSidebar}
                onChange={(e) => setPreferences({...preferences, showLeftSidebar: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Show Right Sidebar</h4>
              <p className="text-sm text-gray-600">Display quick access panel on the right</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.showRightSidebar}
                onChange={(e) => setPreferences({...preferences, showRightSidebar: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Compact Mode</h4>
              <p className="text-sm text-gray-600">Reduce spacing for more content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.compactMode}
                onChange={(e) => setPreferences({...preferences, compactMode: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => {
          setSelectedLayout(DEFAULT_LAYOUT_PREFERENCES.layoutType);
          setPreferences(DEFAULT_LAYOUT_PREFERENCES);
        }}>
          Reset to Default
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
