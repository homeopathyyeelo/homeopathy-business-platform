export interface MarketingCampaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: string;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  message_content: string;
  created_by?: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  segment_id?: string;
  template_id?: string;
  campaign_analytics?: CampaignAnalytics[];
  marketing_segments?: { name: string };
}

export interface MarketingContact {
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  contact_type?: string;
  category?: string;
  society?: string;
  area?: string;
  city?: string;
  is_doctor: boolean;
  is_existing_customer: boolean;
  customer_id?: string;
  is_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  created_at: string;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  delivered_count: number;
  read_count: number;
  clicked_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  phone_number: string;
  reference_id: string;
  message: string;
  type: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  updated_at: string;
}

export interface MarketingSegment {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationFilter {
  states?: number[];
  districts?: number[];
  cities?: number[];
  villages?: number[];
  localities?: number[];
  streets?: number[];
  pincodes?: string[];
}

export interface EnhancedMarketingContact extends MarketingContact {
  street_id?: number;
  locality_id?: number;
  village_id?: number;
  city_id?: number;
  district_id?: number;
  state_id?: number;
  pincode_id?: number;
}

export interface CampaignLog {
  id: string;
  campaign_id: string;
  contact_id: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'facebook' | 'instagram';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'clicked';
  message_content?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}
