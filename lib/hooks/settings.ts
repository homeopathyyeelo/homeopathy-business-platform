import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI } from '@/lib/api'

export interface SystemSetting {
  id: string
  key: string
  value: string
  description: string
  category: string
  data_type: 'string' | 'number' | 'boolean' | 'json'
  is_system: boolean
  is_editable: boolean
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface SettingsQueryParams {
  category?: string
  module?: string
  limit?: number
  offset?: number
}

// Get all settings with optional filters
export function useSystemSettings(params?: SettingsQueryParams) {
  const queryParams = new URLSearchParams()
  if (params?.category) queryParams.set('category', params.category)
  if (params?.module) queryParams.set('module', params.module)
  if (params?.limit) queryParams.set('limit', String(params.limit))
  if (params?.offset) queryParams.set('offset', String(params.offset))

  return useQuery({
    queryKey: ['settings', 'system', params],
    queryFn: async () => {
      try {
        const res = await golangAPI.get(`/api/erp/settings?${queryParams.toString()}`)
        return {
          settings: (res.data?.settings || []) as SystemSetting[],
          total: res.data?.total || 0,
          isDemo: false,
        }
      } catch (err: any) {
        // Fallback demo data to avoid blank UI when API not wired yet
        const cat = params?.category || 'ui'
        const demo: SystemSetting[] = [
          // UI
          { id: 'ui.recordsPerPage', key: 'ui.recordsPerPage', value: '25', description: 'Default items per page', category: 'ui', data_type: 'number', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          { id: 'ui.defaultTheme', key: 'ui.defaultTheme', value: 'light', description: 'Default theme mode', category: 'ui', data_type: 'string', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          { id: 'ui.showTooltips', key: 'ui.showTooltips', value: 'true', description: 'Show tooltips across UI', category: 'ui', data_type: 'boolean', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // Pagination
          { id: 'pagination.tableDensity', key: 'pagination.tableDensity', value: 'comfortable', description: 'Table density', category: 'pagination', data_type: 'string', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // Defaults
          { id: 'defaults.defaultTaxRate', key: 'defaults.defaultTaxRate', value: '18', description: 'Default tax %', category: 'defaults', data_type: 'number', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // Inventory
          { id: 'inventory.lowStockAlertQty', key: 'inventory.lowStockAlertQty', value: '10', description: 'Low stock alert quantity', category: 'inventory', data_type: 'number', is_system: true, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          { id: 'inventory.allowNegativeStock', key: 'inventory.allowNegativeStock', value: 'false', description: 'Allow negative stock', category: 'inventory', data_type: 'boolean', is_system: true, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // Sales
          { id: 'sales.invoicePrefix', key: 'sales.invoicePrefix', value: 'INV-', description: 'Invoice number prefix', category: 'sales', data_type: 'string', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // Finance
          { id: 'finance.defaultCurrency', key: 'finance.defaultCurrency', value: 'INR', description: 'Default currency', category: 'finance', data_type: 'string', is_system: true, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // Notifications
          { id: 'notifications.enableEmailAlerts', key: 'notifications.enableEmailAlerts', value: 'true', description: 'Enable email alerts', category: 'notifications', data_type: 'boolean', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // AI
          { id: 'ai.inventoryAgentThreshold', key: 'ai.inventoryAgentThreshold', value: '0.8', description: 'Inventory agent threshold', category: 'ai', data_type: 'number', is_system: false, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
          // System
          { id: 'system.enableCaching', key: 'system.enableCaching', value: 'true', description: 'Enable caching', category: 'system', data_type: 'boolean', is_system: true, is_editable: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true },
        ]

        const filtered = demo.filter(d => d.category === cat)
        return { settings: filtered, total: filtered.length, isDemo: true }
      }
    },
    staleTime: 600_000, // 10 minutes
  })
}

// Get single setting by key
export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['settings', 'system', key],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/erp/settings/${key}`)
      return res.data as SystemSetting
    },
    enabled: !!key,
    staleTime: 600_000,
  })
}

// Setting mutations
export function useSystemSettingMutations() {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (payload: Partial<SystemSetting>) => 
      golangAPI.post('/api/erp/settings', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'system'] })
    },
  })

  const update = useMutation({
    mutationFn: ({ key, data }: { key: string; data: Partial<SystemSetting> }) =>
      golangAPI.put(`/api/erp/settings/${key}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'system'] })
    },
  })

  const remove = useMutation({
    mutationFn: (key: string) => golangAPI.delete(`/api/erp/settings/${key}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'system'] })
    },
  })

  return { create, update, remove }
}
