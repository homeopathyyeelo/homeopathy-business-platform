'use client';

import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, AlertCircle,
  Clock, CheckCircle, X, Pin, Sparkles, MessageCircle, Mail, Send,
  ChevronRight, Activity, ShoppingCart, ShoppingBag, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KPI {
  label: string;
  value: string;
  change: number;
  icon: any;
  trend: 'up' | 'down';
}

interface Activity {
  id: string;
  type: 'sale' | 'purchase' | 'return' | 'payment';
  title: string;
  description: string;
  time: string;
  amount?: string;
}

interface Reminder {
  id: string;
  type: 'payment' | 'expiry' | 'reorder' | 'followup';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export default function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [pinnedItems, setPinnedItems] = useState<string[]>(['invoices', 'customers']);

  // Mock data - replace with real API calls
  const kpis: KPI[] = [
    {
      label: "Today's Sales",
      value: '₹45,230',
      change: 12.5,
      icon: ShoppingCart,
      trend: 'up'
    },
    {
      label: "Today's Purchase",
      value: '₹28,500',
      change: -5.2,
      icon: ShoppingBag,
      trend: 'down'
    },
    {
      label: 'Profit',
      value: '₹16,730',
      change: 8.3,
      icon: DollarSign,
      trend: 'up'
    },
    {
      label: 'Outstanding',
      value: '₹1,24,500',
      change: -3.1,
      icon: AlertCircle,
      trend: 'down'
    }
  ];

  const reminders: Reminder[] = [
    {
      id: '1',
      type: 'payment',
      title: 'Payment Due',
      description: 'ABC Distributors - ₹25,000',
      priority: 'high',
      dueDate: 'Today'
    },
    {
      id: '2',
      type: 'expiry',
      title: 'Expiry Alert',
      description: '15 products expiring in 30 days',
      priority: 'medium',
      dueDate: '30 days'
    },
    {
      id: '3',
      type: 'reorder',
      title: 'Low Stock',
      description: 'SBL Arnica 30C - 5 bottles left',
      priority: 'high',
      dueDate: 'Urgent'
    },
    {
      id: '4',
      type: 'followup',
      title: 'Customer Follow-up',
      description: 'Dr. Sharma - Pending order',
      priority: 'low',
      dueDate: 'Tomorrow'
    }
  ];

  const recentActivities: Activity[] = [
    {
      id: '1',
      type: 'sale',
      title: 'New Sale',
      description: 'Invoice #INV-2024-001',
      time: '5 min ago',
      amount: '₹2,450'
    },
    {
      id: '2',
      type: 'purchase',
      title: 'Purchase Order',
      description: 'PO #PO-2024-045',
      time: '15 min ago',
      amount: '₹15,000'
    },
    {
      id: '3',
      type: 'return',
      title: 'Sales Return',
      description: 'Return #RET-2024-012',
      time: '1 hour ago',
      amount: '₹850'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Payment Received',
      description: 'Customer: Rajesh Medical',
      time: '2 hours ago',
      amount: '₹8,500'
    }
  ];

  const aiInsights = [
    {
      id: '1',
      title: 'Stock Alert',
      description: '12 products need reordering based on sales trend',
      action: 'View Details',
      icon: Package
    },
    {
      id: '2',
      title: 'Top Customer',
      description: 'Dr. Kumar purchased 25% more this month',
      action: 'Send Offer',
      icon: Users
    },
    {
      id: '3',
      title: 'Profit Opportunity',
      description: 'Increase margin on 8 fast-moving products',
      action: 'Optimize',
      icon: TrendingUp
    }
  ];

  const quickActions = [
    { label: 'New Invoice', path: '/sales/pos', icon: ShoppingCart },
    { label: 'New PO', path: '/purchases/orders/new', icon: ShoppingBag },
    { label: 'Add Customer', path: '/customers/new', icon: Users },
    { label: 'Add Product', path: '/products/new', icon: Package }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-950';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'text-blue-500 bg-blue-50 dark:bg-blue-950';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return ShoppingCart;
      case 'purchase': return ShoppingBag;
      case 'return': return TrendingDown;
      case 'payment': return DollarSign;
      default: return Activity;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Right Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 right-0 h-screen w-80 bg-card border-l border-border z-50 transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Quick Access</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 mx-4 mt-2">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">AI Insights</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Quick KPIs */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">TODAY'S METRICS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {kpis.map((kpi, index) => {
                      const Icon = kpi.icon;
                      return (
                        <Card key={index} className="p-3">
                          <div className="flex items-start justify-between">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {kpi.trend === 'up' ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="text-lg font-bold">{kpi.value}</p>
                            <p className={cn(
                              "text-xs",
                              kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                            )}>
                              {kpi.change > 0 ? '+' : ''}{kpi.change}%
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Reminders */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">REMINDERS</h3>
                  <div className="space-y-2">
                    {reminders.map((reminder) => (
                      <Card key={reminder.id} className="p-3 hover:bg-accent/50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5",
                            getPriorityColor(reminder.priority)
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{reminder.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{reminder.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{reminder.dueDate}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Recent Activities */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">RECENT ACTIVITY</h3>
                  <div className="space-y-2">
                    {recentActivities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                              {activity.amount && (
                                <span className="text-xs font-medium">{activity.amount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* AI Insights Tab */}
              <TabsContent value="insights" className="space-y-4 mt-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">AI RECOMMENDATIONS</h3>
                  <div className="space-y-3">
                    {aiInsights.map((insight) => {
                      const Icon = insight.icon;
                      return (
                        <Card key={insight.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{insight.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                              <Button size="sm" variant="outline" className="mt-3 w-full">
                                {insight.action}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* AI Summary */}
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <div className="flex items-start gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-semibold">Daily AI Summary</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Sales are up 12% today. 3 products need restocking. Outstanding collections improved by ₹15,000.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    View Full Report
                  </Button>
                </Card>
              </TabsContent>

              {/* Quick Actions Tab */}
              <TabsContent value="actions" className="space-y-4 mt-4">
                {/* Pinned Items */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">PINNED SHORTCUTS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-20 flex flex-col items-center justify-center gap-2"
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Communication */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">QUICK COMMUNICATION</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Send WhatsApp
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Send className="h-4 w-4" />
                      Send SMS
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* To-Do List */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3">TODAY'S TASKS</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm flex-1">Review pending invoices</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm flex-1">Call vendor for delivery</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm flex-1">Update stock counts</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </aside>
    </>
  );
}
