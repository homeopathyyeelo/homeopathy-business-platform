import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export function WhatsAppCampaignManager() {
    const [sessionId, setSessionId] = useState(`campaign_${new Date().toISOString().split('T')[0]}`);
    const [messageType, setMessageType] = useState('offer');
    const [content, setContent] = useState('');
    const [personalize, setPersonalize] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Mock customer groups for demo
    const customerGroups = [
        { id: 'all', name: 'All Customers (2500)' },
        { id: 'recent', name: 'Recent Visitors (Last 30 days) (120)' },
        { id: 'vip', name: 'VIP Customers (50)' },
    ];
    const [selectedGroup, setSelectedGroup] = useState('recent');

    const handleSend = async () => {
        if (!content) return toast.error("Please enter message content");

        setIsSending(true);
        try {
            // In a real app, we'd fetch the actual phone numbers for the selected group
            // For now, we'll send a dummy list or let the backend handle the group expansion
            const mockNumbers = ["+919999999999", "+918888888888"];

            // Mock user data for personalization demo
            const mockUserData = personalize ? [
                { name: "Ravi", phone_number: "+919999999999", conditions: ["allergy"], last_purchase: "Thuja" },
                { name: "Sunita", phone_number: "+918888888888", conditions: ["stress"], last_purchase: "Kali Phos" }
            ] : [];

            const res = await api.whatsapp.sendBulk({
                session_id: sessionId,
                message_type: messageType,
                group: mockNumbers,
                content,
                personalize,
                user_data: mockUserData
            });

            if (res.data.success) {
                toast.success(`Campaign sent! (${res.data.count || 0} messages)`);
                if (res.data.message) toast.info(res.data.message);
            }
        } catch (error) {
            toast.error("Failed to send campaign");
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    WhatsApp Campaign Manager
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Session ID</label>
                        <Input value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Message Type</label>
                        <Select value={messageType} onValueChange={setMessageType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="offer">Promotional Offer</SelectItem>
                                <SelectItem value="update">Transactional Update</SelectItem>
                                <SelectItem value="recommendation">Product Recommendation</SelectItem>
                                <SelectItem value="reminder">Reminder</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Audience</label>
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {customerGroups.map(g => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <Switch id="personalize" checked={personalize} onCheckedChange={setPersonalize} />
                    <label htmlFor="personalize" className="text-sm font-medium">
                        Use AI Personalization
                    </label>
                    <span className="text-xs text-muted-foreground ml-2">
                        (Tailors message based on customer history)
                    </span>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Message Content Template</label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={personalize ? "Hi {name}, we have a special offer on {last_purchase}..." : "Enter your bulk message here..."}
                        className="min-h-[100px]"
                    />
                </div>

                <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleSend}
                    disabled={isSending || !content}
                >
                    {isSending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                        </>
                    ) : (
                        <>
                            <Users className="mr-2 h-4 w-4" /> Send Bulk Campaign
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
