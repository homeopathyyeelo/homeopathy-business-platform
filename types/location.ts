
export interface State {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: number;
  name: string;
  state_id: number;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  district_id: number;
  created_at: string;
  updated_at: string;
}

export interface Village {
  id: number;
  name: string;
  city_id: number;
  created_at: string;
  updated_at: string;
}

export interface Locality {
  id: number;
  name: string;
  village_id?: number;
  city_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Street {
  id: number;
  name: string;
  locality_id: number;
  created_at: string;
  updated_at: string;
}

export interface Pincode {
  id: number;
  pincode: string;
  area_name?: string;
  city_id?: number;
  district_id?: number;
  state_id?: number;
  created_at: string;
  updated_at: string;
}

// Flexible LocationFilter that supports both IDs and string values
export interface LocationFilter {
  states?: (number | string)[];
  districts?: (number | string)[];
  cities?: (number | string)[];
  villages?: (number | string)[];
  localities?: (number | string)[];
  streets?: (number | string)[];
  pincodes?: string[];
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
