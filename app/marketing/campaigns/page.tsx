'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Pause, Eye } from 'lucide-react'
import { useCampaigns, useCampaignMutations } from '@/lib/hooks/marketing'

export default function CampaignsPage() {
  const { data: campaigns = [], isLoading: loading } = useCampaigns()
  const { launch, pause } = useCampaignMutations()

  const launchCampaign = async (id: string) => {
    try {
      await launch.mutateAsync(id)
    } catch (error) {
      console.error('Error launching campaign:', error)
    }
  }

  const pauseCampaign = async (id: string) => {
    try {
      await pause.mutateAsync(id)
    } catch (error) {
      console.error('Error pausing campaign:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
      draft: 'secondary',
      scheduled: 'outline',
      running: 'default',
      completed: 'default',
      paused: 'secondary'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{campaign.campaign_name}</CardTitle>
                {getStatusBadge(campaign.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{campaign.description}</p>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-semibold">{campaign.campaign_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Target</p>
                  <p className="font-semibold">{campaign.target_count || 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sent</span>
                  <span className="font-semibold">{campaign.sent_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivered</span>
                  <span className="font-semibold text-green-600">{campaign.delivered_count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Failed</span>
                  <span className="font-semibold text-red-600">{campaign.failed_count || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {campaign.status === 'draft' && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => launchCampaign(campaign.id)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Launch
                  </Button>
                )}
                {campaign.status === 'running' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => pauseCampaign(campaign.id)}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No campaigns yet. Create your first campaign!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
