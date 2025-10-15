import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { golangAPI, nestjsAPI } from '@/lib/api'

// Types for Finance Module
export interface JournalEntry {
  id: string
  entry_number: string
  entry_date: string
  description: string
  entries: JournalEntryItem[]
  total_debit: number
  total_credit: number
  status: 'draft' | 'posted' | 'cancelled'
  created_by: string
  notes?: string
}

export interface JournalEntryItem {
  id: string
  account_id: string
  account_name: string
  debit: number
  credit: number
  description?: string
}

export interface Account {
  id: string
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parent_account_id?: string
  balance: number
  is_active: boolean
}

export interface LedgerEntry {
  id: string
  account_id: string
  account_name: string
  account_code: string
  entry_date: string
  description: string
  debit: number
  credit: number
  balance: number
  reference?: string
  entry_type: 'journal' | 'sale' | 'purchase' | 'payment' | 'receipt'
}

export interface FinancialStatement {
  id: string
  period: string
  period_type: 'monthly' | 'quarterly' | 'yearly'
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_income: number
  total_expenses: number
  net_profit: number
  generated_at: string
}

export interface ProfitLossStatement {
  id: string
  period: string
  period_type: 'monthly' | 'quarterly' | 'yearly'
  income: {
    sales_revenue: number
    other_income: number
    total_income: number
  }
  expenses: {
    cost_of_goods_sold: number
    operating_expenses: number
    other_expenses: number
    total_expenses: number
  }
  gross_profit: number
  net_profit: number
  generated_at: string
}

export interface BalanceSheet {
  id: string
  as_of_date: string
  assets: {
    current_assets: number
    fixed_assets: number
    total_assets: number
  }
  liabilities: {
    current_liabilities: number
    long_term_liabilities: number
    total_liabilities: number
  }
  equity: {
    share_capital: number
    retained_earnings: number
    total_equity: number
  }
  generated_at: string
}

// Finance Hooks
export function useJournalEntries(filters?: {
  status?: string
  start_date?: string
  end_date?: string
  account_id?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['finance', 'journals', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.account_id) params.append('account_id', filters.account_id)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await golangAPI.get(`/api/finance/journals?${params}`)
      return res.data as JournalEntry[]
    },
    staleTime: 30_000,
  })
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: ['finance', 'journal', id],
    queryFn: async () => {
      const res = await golangAPI.get(`/api/finance/journals/${id}`)
      return res.data as JournalEntry
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useAccounts(filters?: {
  account_type?: string
  is_active?: boolean
  parent_account_id?: string
}) {
  return useQuery({
    queryKey: ['finance', 'accounts', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.account_type) params.append('account_type', filters.account_type)
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())
      if (filters?.parent_account_id) params.append('parent_account_id', filters.parent_account_id)

      const res = await golangAPI.get(`/api/finance/accounts?${params}`)
      return res.data as Account[]
    },
    staleTime: 300_000,
  })
}

export function useLedger(accountId: string, filters?: {
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['finance', 'ledger', accountId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const res = await golangAPI.get(`/api/finance/ledger/${accountId}?${params}`)
      return res.data as LedgerEntry[]
    },
    enabled: !!accountId,
    staleTime: 30_000,
  })
}

export function useProfitLossStatement(filters?: {
  period?: string
  period_type?: 'monthly' | 'quarterly' | 'yearly'
}) {
  return useQuery({
    queryKey: ['finance', 'pl', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.period) params.append('period', filters.period)
      if (filters?.period_type) params.append('period_type', filters.period_type)

      const res = await golangAPI.get(`/api/finance/profit-loss?${params}`)
      return res.data as ProfitLossStatement
    },
    staleTime: 60_000,
  })
}

export function useBalanceSheet(filters?: {
  as_of_date?: string
}) {
  return useQuery({
    queryKey: ['finance', 'balance-sheet', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.as_of_date) params.append('as_of_date', filters.as_of_date)

      const res = await golangAPI.get(`/api/finance/balance-sheet?${params}`)
      return res.data as BalanceSheet
    },
    staleTime: 60_000,
  })
}

export function useTrialBalance(filters?: {
  as_of_date?: string
}) {
  return useQuery({
    queryKey: ['finance', 'trial-balance', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.as_of_date) params.append('as_of_date', filters.as_of_date)

      const res = await golangAPI.get(`/api/finance/trial-balance?${params}`)
      return res.data as Array<{
        account_id: string
        account_name: string
        account_code: string
        debit: number
        credit: number
        balance: number
      }>
    },
    staleTime: 60_000,
  })
}

// Finance Mutations
export function useFinanceMutations() {
  const queryClient = useQueryClient()

  const createJournalEntry = useMutation({
    mutationFn: async (entryData: Omit<JournalEntry, 'id' | 'entry_number' | 'created_by'>) => {
      const res = await golangAPI.post('/api/finance/journals', entryData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })

  const updateJournalEntry = useMutation({
    mutationFn: async ({ id, ...entryData }: Partial<JournalEntry> & { id: string }) => {
      const res = await golangAPI.put(`/api/finance/journals/${id}`, entryData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })

  const postJournalEntry = useMutation({
    mutationFn: async (id: string) => {
      const res = await golangAPI.post(`/api/finance/journals/${id}/post`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })

  const deleteJournalEntry = useMutation({
    mutationFn: async (id: string) => {
      await golangAPI.delete(`/api/finance/journals/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })

  const createAccount = useMutation({
    mutationFn: async (accountData: Omit<Account, 'id'>) => {
      const res = await golangAPI.post('/api/finance/accounts', accountData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
    },
  })

  return {
    createJournal: createJournalEntry,
    updateJournal: updateJournalEntry,
    postJournal: postJournalEntry,
    deleteJournal: deleteJournalEntry,
    createAccount,
  }
}
