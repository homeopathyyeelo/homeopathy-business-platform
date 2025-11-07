'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Save, ArrowLeft } from 'lucide-react'
import { useCustomers, useCustomerMutations } from '@/lib/hooks/customers'
import { authFetch } from '@/lib/api/fetch-utils';

export default function CustomerCreditLimitPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: customers = [], refetch, isFetching } = useCustomers()
  const { update } = useCustomerMutations()

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [creditLimit, setCreditLimit] = useState<number>(0)
  const [outstanding, setOutstanding] = useState<number>(0)

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter((c: any) =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    )
  }, [customers, search])

  useEffect(() => {
    if (!selectedId && customers.length > 0) {
      const first = customers[0]
      setSelectedId(first.id ?? first.customer_id ?? '')
      setCreditLimit(first.credit_limit ?? 0)
      setOutstanding(first.outstanding ?? 0)
    }
  }, [customers, selectedId])

  const selected = useMemo(() => {
    return filtered.find((c: any) => (c.id ?? c.customer_id) === selectedId)
  }, [filtered, selectedId])

  useEffect(() => {
    if (selected) {
      setCreditLimit(selected.credit_limit ?? 0)
      setOutstanding(selected.outstanding ?? 0)
    }
  }, [selected])

  const handleSave = async () => {
    if (!selectedId) return
    try {
      await update.mutateAsync({ id: selectedId, data: { credit_limit: creditLimit } })
      toast({ title: 'Credit limit updated' })
      refetch()
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2"/>
            Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Customer Credit Limit</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}/>
            Refresh
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2"/>
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="list">Customer List</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Update Credit Limit</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Customer</Label>
                <Input id="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone"/>
              </div>
              <div className="space-y-2">
                <Label>Selected Customer</Label>
                <div className="p-3 border rounded-md min-h-[42px] bg-muted/30">
                  {selected ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selected.name}</p>
                        <p className="text-xs text-muted-foreground">{selected.email} · {selected.phone}</p>
                      </div>
                      <Badge variant="secondary">{(selected.type ?? selected.customer_type ?? 'retail').toString()}</Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No customer selected</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (₹)</Label>
                <Input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Outstanding (₹)</Label>
                <Input type="number" value={outstanding} disabled/>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Input placeholder="Filter customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Credit Limit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c: any) => (
                      <TableRow key={c.id ?? c.customer_id} className={selectedId === (c.id ?? c.customer_id) ? 'bg-muted/40' : ''}>
                        <TableCell className="font-medium cursor-pointer" onClick={() => setSelectedId(c.id ?? c.customer_id)}>
                          {c.name}
                        </TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="text-right">₹{(c.outstanding ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{(c.credit_limit ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
