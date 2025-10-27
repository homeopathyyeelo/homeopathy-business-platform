'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Mail, 
  Send, 
  Users, 
  TrendingUp, 
  Calendar,
  Gift,
  Sparkles,
  Megaphone,
  Target,
  BarChart3,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CampaignStats {
  total: number;
  active: number;
  completed: number;
  scheduled: number;
}

interface ChannelStats {
  whatsapp: { sent: number; delivered: number; read: number };
  sms: { sent: number; delivered: number };
  email: { sent: number; opened: number; clicked: number };
}

export default function MarketingDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    total: 0,
    active: 0,
    completed: 0,
    scheduled: 0
  });
  const [channelStats, setChannelStats] = useState<ChannelStats>({
    whatsapp: { sent: 0, delivered: 0, read: 0 },
    sms: { sent: 0, delivered: 0 },
    email: { sent: 0, opened: 0, clicked: 0 }
  });

  useEffect(() => {
    // Fetch stats from API
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API calls
      setCampaignStats({
        total: 24,
        active: 5,
        completed: 15,
        scheduled: 4
      });
      setChannelStats({
        whatsapp: { sent: 1250, delivered: 1180, read: 950 },
        sms: { sent: 850, delivered: 820 },
        email: { sent: 2100, opened: 1450, clicked: 680 }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const marketingModules = [
    {
      title: 'WhatsApp Campaigns',
      description: 'Send bulk WhatsApp messages to customers',
      icon: MessageSquare,
      href: '/marketing/whatsapp',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stats: `${channelStats.whatsapp.sent} sent`
    },
    {
      title: 'SMS Campaigns',
      description: 'Send promotional SMS to customers',
      icon: Send,
      href: '/marketing/sms',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: `${channelStats.sms.sent} sent`
    },
    {
      title: 'Email Campaigns',
      description: 'Send email newsletters and promotions',
      icon: Mail,
      href: '/marketing/email',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stats: `${channelStats.email.sent} sent`
    },
    {
      title: 'Offers & Coupons',
      description: 'Create discount offers and coupon codes',
      icon: Gift,
      href: '/marketing/offers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      stats: 'Active offers'
    },
    {
      title: 'Festival Campaigns',
      description: 'Special campaigns for festivals',
      icon: Sparkles,
      href: '/marketing/festival',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      stats: 'Upcoming'
    },
    {
      title: 'Templates',
      description: 'Pre-designed message templates',
      icon: Target,
      href: '/marketing/templates',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      stats: '25 templates'
    },
    {
      title: 'AI Campaign Generator',
      description: 'Generate campaigns with AI',
      icon: Sparkles,
      href: '/marketing/ai-generator',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      stats: 'New'
    },
    {
      title: 'Dealer Announcements',
      description: 'Send announcements to dealers',
      icon: Megaphone,
      href: '/marketing/announcements',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      stats: 'Broadcast'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all your marketing campaigns and customer communications
          </p>
        </div>
        <Button onClick={() => router.push('/marketing/whatsapp')}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.total}</div>
            <p className="text-xs text-muted-foreground">All time campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{campaignStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{campaignStats.scheduled}</div>
            <p className="text-xs text-muted-foreground">Upcoming campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="whatsapp" className="space-y-4">
            <TabsList>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="whatsapp" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Messages Sent</p>
                  <p className="text-2xl font-bold">{channelStats.whatsapp.sent}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{channelStats.whatsapp.delivered}</p>
                  <p className="text-xs text-muted-foreground">
                    {((channelStats.whatsapp.delivered / channelStats.whatsapp.sent) * 100).toFixed(1)}% delivery rate
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Read</p>
                  <p className="text-2xl font-bold text-blue-600">{channelStats.whatsapp.read}</p>
                  <p className="text-xs text-muted-foreground">
                    {((channelStats.whatsapp.read / channelStats.whatsapp.delivered) * 100).toFixed(1)}% read rate
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="sms" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Messages Sent</p>
                  <p className="text-2xl font-bold">{channelStats.sms.sent}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">{channelStats.sms.delivered}</p>
                  <p className="text-xs text-muted-foreground">
                    {((channelStats.sms.delivered / channelStats.sms.sent) * 100).toFixed(1)}% delivery rate
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="email" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Emails Sent</p>
                  <p className="text-2xl font-bold">{channelStats.email.sent}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Opened</p>
                  <p className="text-2xl font-bold text-green-600">{channelStats.email.opened}</p>
                  <p className="text-xs text-muted-foreground">
                    {((channelStats.email.opened / channelStats.email.sent) * 100).toFixed(1)}% open rate
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Clicked</p>
                  <p className="text-2xl font-bold text-blue-600">{channelStats.email.clicked}</p>
                  <p className="text-xs text-muted-foreground">
                    {((channelStats.email.clicked / channelStats.email.opened) * 100).toFixed(1)}% click rate
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Marketing Modules Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Marketing Channels</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {marketingModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${module.bgColor}`}>
                        <Icon className={`h-6 w-6 ${module.color}`} />
                      </div>
                      <span className="text-xs text-muted-foreground">{module.stats}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-1">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/marketing/whatsapp')}
            >
              <MessageSquare className="mr-2 h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Send WhatsApp</div>
                <div className="text-xs text-muted-foreground">Bulk WhatsApp messages</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/marketing/offers')}
            >
              <Gift className="mr-2 h-5 w-5 text-orange-600" />
              <div className="text-left">
                <div className="font-semibold">Create Offer</div>
                <div className="text-xs text-muted-foreground">Discount coupons</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/marketing/templates')}
            >
              <Target className="mr-2 h-5 w-5 text-indigo-600" />
              <div className="text-left">
                <div className="font-semibold">Use Template</div>
                <div className="text-xs text-muted-foreground">Pre-designed messages</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
