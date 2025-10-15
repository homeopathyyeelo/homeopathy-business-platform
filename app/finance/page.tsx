'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useJournalEntries, useAccounts, useProfitLossStatement, useBalanceSheet, useFinanceMutations } from "@/lib/hooks/finance"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Eye, Edit, Trash2, Book, TrendingUp, DollarSign, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FinancePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentTab, setCurrentTab] = useState("ledger")
  const [selectedPeriod, setSelectedPeriod] = useState("current-month")

  // Use React Query hooks for enhanced functionality
  const { data: journalEntries = [] } = useJournalEntries()
  const { data: accounts = [] } = useAccounts()
  const { data: plStatement } = useProfitLossStatement({ period: selectedPeriod })
  const { data: balanceSheet } = useBalanceSheet({ as_of_date: selectedPeriod })
  const { deleteJournal } = useFinanceMutations()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      posted: 'default',
      cancelled: 'destructive',
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
  }

  const handleDeleteJournal = async (id: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await deleteJournal.mutateAsync(id)
        toast({
          title: "Success",
          description: "Journal entry deleted successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete journal entry",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance & Accounting</h2>
          <p className="text-gray-600">General ledger, P&L, balance sheet, and financial statements</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => router.push('/finance/journals/add')}>
            <Plus className="w-4 h-4 mr-2" />
            New Journal Entry
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="current-quarter">Current Quarter</SelectItem>
              <SelectItem value="current-year">Current Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(balanceSheet?.assets?.total_assets || 0)}</div>
            <p className="text-xs text-muted-foreground">As of {formatDate(balanceSheet?.as_of_date || new Date().toISOString())}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(plStatement?.net_profit || 0)}</div>
            <p className="text-xs text-muted-foreground">For {selectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Book className="w-4 h-4 mr-2" />
              Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalEntries.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.filter(acc => acc.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Chart of accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different finance modules */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Account</th>
                      <th className="text-left p-4">Account Code</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-right p-4">Balance</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.filter(acc => acc.is_active).map((account) => (
                      <tr key={account.id} className="border-b">
                        <td className="p-4 font-medium">{account.account_name}</td>
                        <td className="p-4">{account.account_code}</td>
                        <td className="p-4">
                          <Badge variant="outline">{account.account_type}</Badge>
                        </td>
                        <td className="p-4 text-right">{formatCurrency(account.balance)}</td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/finance/ledger/${account.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Entry #</th>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-right p-4">Debit</th>
                      <th className="text-right p-4">Credit</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.map((entry) => (
                      <tr key={entry.id} className="border-b">
                        <td className="p-4 font-medium">{entry.entry_number}</td>
                        <td className="p-4">{formatDate(entry.entry_date)}</td>
                        <td className="p-4">{entry.description}</td>
                        <td className="p-4 text-right">{formatCurrency(entry.total_debit)}</td>
                        <td className="p-4 text-right">{formatCurrency(entry.total_credit)}</td>
                        <td className="p-4">{getStatusBadge(entry.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/finance/journals/${entry.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/finance/journals/${entry.id}/edit`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteJournal(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Income Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Income</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sales Revenue</span>
                    <span className="font-semibold text-green-600">{formatCurrency(plStatement?.income?.sales_revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Income</span>
                    <span className="font-semibold text-green-600">{formatCurrency(plStatement?.income?.other_income || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Income</span>
                    <span className="font-semibold text-green-600">{formatCurrency(plStatement?.income?.total_income || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Cost of Goods Sold</span>
                    <span className="font-semibold text-red-600">{formatCurrency(plStatement?.expenses?.cost_of_goods_sold || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operating Expenses</span>
                    <span className="font-semibold text-red-600">{formatCurrency(plStatement?.expenses?.operating_expenses || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Expenses</span>
                    <span className="font-semibold text-red-600">{formatCurrency(plStatement?.expenses?.other_expenses || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Expenses</span>
                    <span className="font-semibold text-red-600">{formatCurrency(plStatement?.expenses?.total_expenses || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-xl font-bold">Net Profit</span>
                  <span className={`text-xl font-bold ${plStatement?.net_profit && plStatement.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(plStatement?.net_profit || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assets Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Assets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Assets</span>
                    <span className="font-semibold">{formatCurrency(balanceSheet?.assets?.current_assets || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fixed Assets</span>
                    <span className="font-semibold">{formatCurrency(balanceSheet?.assets?.fixed_assets || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Assets</span>
                    <span className="font-semibold">{formatCurrency(balanceSheet?.assets?.total_assets || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Liabilities</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Liabilities</span>
                    <span className="font-semibold text-red-600">{formatCurrency(balanceSheet?.liabilities?.current_liabilities || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long-term Liabilities</span>
                    <span className="font-semibold text-red-600">{formatCurrency(balanceSheet?.liabilities?.long_term_liabilities || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Liabilities</span>
                    <span className="font-semibold text-red-600">{formatCurrency(balanceSheet?.liabilities?.total_liabilities || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Equity Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Equity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Share Capital</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(balanceSheet?.equity?.share_capital || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retained Earnings</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(balanceSheet?.equity?.retained_earnings || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Equity</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(balanceSheet?.equity?.total_equity || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-xl font-bold">Assets = Liabilities + Equity</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(balanceSheet?.assets?.total_assets || 0)} = {formatCurrency((balanceSheet?.liabilities?.total_liabilities || 0) + (balanceSheet?.equity?.total_equity || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
