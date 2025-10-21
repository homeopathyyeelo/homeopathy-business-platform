// AI SWR Hooks
import useSWR from 'swr';
import { aiService } from '../services/ai.service';

export function useChatSessions() {
  const { data, error, isLoading, mutate } = useSWR(
    '/ai/chat/sessions',
    () => aiService.getChatSessions()
  );

  return {
    sessions: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useChatSession(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/ai/chat/sessions/${id}` : null,
    () => aiService.getChatSession(id)
  );

  return {
    session: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDemandForecast(params?: {
  productId?: string;
  categoryId?: string;
  branchId?: string;
  period?: 'week' | 'month' | 'quarter';
}) {
  const { data, error, isLoading } = useSWR(
    [`/ai/forecast/demand`, params],
    () => aiService.getDemandForecast(params)
  );

  return {
    forecast: data || [],
    isLoading,
    isError: error,
  };
}

export function useSalesInsights(params?: {
  period?: string;
  branchId?: string;
}) {
  const { data, error, isLoading } = useSWR(
    [`/ai/insights/sales`, params],
    () => aiService.getSalesInsights(params)
  );

  return {
    insights: data || [],
    isLoading,
    isError: error,
  };
}

export function useCustomerInsights(customerId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/ai/insights/customers`, customerId],
    () => aiService.getCustomerInsights(customerId)
  );

  return {
    insights: data,
    isLoading,
    isError: error,
  };
}

export function useInventoryInsights(branchId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/ai/insights/inventory`, branchId],
    () => aiService.getInventoryInsights(branchId)
  );

  return {
    insights: data,
    isLoading,
    isError: error,
  };
}

export function useReorderSuggestionsAI(branchId?: string) {
  const { data, error, isLoading } = useSWR(
    [`/ai/purchase-order/suggestions`, branchId],
    () => aiService.getReorderSuggestions(branchId)
  );

  return {
    suggestions: data || [],
    isLoading,
    isError: error,
  };
}

export function usePriceOptimization(params?: {
  productId?: string;
  categoryId?: string;
}) {
  const { data, error, isLoading } = useSWR(
    [`/ai/pricing/optimize`, params],
    () => aiService.getPriceOptimization(params)
  );

  return {
    optimizations: data || [],
    isLoading,
    isError: error,
  };
}

export function useAutomationRules() {
  const { data, error, isLoading, mutate } = useSWR(
    '/ai/automation/rules',
    () => aiService.getAutomationRules()
  );

  return {
    rules: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDailySummary(date?: string) {
  const { data, error, isLoading } = useSWR(
    [`/ai/summary/daily`, date],
    () => aiService.getDailySummary(date)
  );

  return {
    summary: data,
    isLoading,
    isError: error,
  };
}

export function useAIModels() {
  const { data, error, isLoading } = useSWR(
    '/ai/models',
    () => aiService.getAIModels()
  );

  return {
    models: data || [],
    isLoading,
    isError: error,
  };
}
