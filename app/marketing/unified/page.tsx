"use client"

import React from 'react';
import { UnifiedPostComposer } from '@/components/social/UnifiedPostComposer';
import { WhatsAppCampaignManager } from '@/components/marketing/WhatsAppCampaignManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, MessageCircle } from 'lucide-react';

export default function UnifiedMarketingPage() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Unified Marketing Hub</h1>
                <p className="text-muted-foreground">
                    Manage your social media presence and WhatsApp marketing campaigns from a single dashboard.
                </p>
            </div>

            <Tabs defaultValue="social" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="social" className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" /> Social Posting
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> WhatsApp Campaigns
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="social" className="mt-6">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Social Media Composer</CardTitle>
                                <CardDescription>
                                    Create and schedule posts for Instagram, Facebook, and Google My Business.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UnifiedPostComposer />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="mt-6">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>WhatsApp Marketing</CardTitle>
                                <CardDescription>
                                    Send bulk messages, offers, and personalized recommendations to your customers.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <WhatsAppCampaignManager />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
