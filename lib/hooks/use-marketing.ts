// Marketing SWR Hooks
import useSWR from 'swr';
import { marketingService } from '../services/marketing.service';

export function useCampaigns(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/marketing/campaigns`, params],
    () => marketingService.getCampaigns(params)
  );

  return {
    campaigns: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCampaign(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/marketing/campaigns/${id}` : null,
    () => marketingService.getCampaign(id)
  );

  return {
    campaign: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCampaignAnalytics(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `/marketing/campaigns/${id}/analytics` : null,
    () => marketingService.getCampaignAnalytics(id)
  );

  return {
    analytics: data,
    isLoading,
    isError: error,
  };
}

export function useOffers(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/marketing/offers`, params],
    () => marketingService.getOffers(params)
  );

  return {
    offers: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCoupons(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/marketing/coupons`, params],
    () => marketingService.getCoupons(params)
  );

  return {
    coupons: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTemplates(params?: {
  type?: string;
  category?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/marketing/templates`, params],
    () => marketingService.getTemplates(params)
  );

  return {
    templates: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useGiftCards() {
  const { data, error, isLoading, mutate } = useSWR(
    '/marketing/gift-cards',
    () => marketingService.getGiftCards()
  );

  return {
    giftCards: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useLoyaltyProgram() {
  const { data, error, isLoading, mutate } = useSWR(
    '/marketing/loyalty-program',
    () => marketingService.getLoyaltyProgram()
  );

  return {
    loyaltyProgram: data,
    isLoading,
    isError: error,
    mutate,
  };
}
