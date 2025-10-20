'use client';

import { useState } from 'react';
import {
  X,
  Filter,
  Calendar,
  Tag,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RightPanel({ isOpen, onClose }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState('filters');

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        'w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-lg">Quick Access</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Filters Tab */}
          <TabsContent value="filters" className="p-4 space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Quick Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Date Range
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-3 w-3 mr-2" />
                      Today
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-3 w-3 mr-2" />
                      This Week
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-3 w-3 mr-2" />
                      This Month
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="h-3 w-3 mr-2" />
                      Custom
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-1 space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                      Active
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Clock className="h-3 w-3 mr-2 text-yellow-500" />
                      Pending
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <AlertCircle className="h-3 w-3 mr-2 text-red-500" />
                      Overdue
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Category
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="cursor-pointer">
                      <Tag className="h-3 w-3 mr-1" />
                      Medicine
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer">
                      <Tag className="h-3 w-3 mr-1" />
                      Supplements
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer">
                      <Tag className="h-3 w-3 mr-1" />
                      Books
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Saved Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Low Stock Items
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Expiring This Month
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Top Selling Products
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="p-4 space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Reorder Suggestion
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Product "Arnica 30" is running low. Suggested reorder: 50 units
                      </p>
                      <Button size="sm" className="mt-2 h-7 text-xs">
                        Create PO
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Campaign Idea
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Send seasonal promotion to customers who bought immunity products
                      </p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                        Generate Campaign
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick AI Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Sparkles className="h-3 w-3 mr-2" />
                  Generate Product Description
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Create WhatsApp Message
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Forecast Next Month Sales
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="p-4 space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Invoice #INV-1234 created</p>
                    <p className="text-xs text-gray-500">Customer: John Doe</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Stock adjusted</p>
                    <p className="text-xs text-gray-500">Product: Arnica 30 (+20 units)</p>
                    <p className="text-xs text-gray-400">15 minutes ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Campaign sent</p>
                    <p className="text-xs text-gray-500">150 messages delivered</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Purchase order approved</p>
                    <p className="text-xs text-gray-500">PO #PO-5678</p>
                    <p className="text-xs text-gray-400">3 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm font-medium">Sales Return #SR-123</p>
                  <p className="text-xs text-gray-500">Amount: ₹2,500</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-6 text-xs">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      Reject
                    </Button>
                  </div>
                </div>

                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm font-medium">Discount Request</p>
                  <p className="text-xs text-gray-500">10% off on Invoice #INV-9999</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-6 text-xs">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
