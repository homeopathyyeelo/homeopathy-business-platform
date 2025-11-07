"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Search, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { authFetch } from '@/lib/api/fetch-utils';

interface ParsedLine {
  line_id: string
  line_number: number
  description: string
  qty: number
  unit_price: number
  tax_rate: number
  line_total: number
  batch_no?: string
  expiry_date?: string
  suggested_product_id?: string
  matched_product_id?: string
  match_type?: string
  match_confidence?: number
  status: string
}

export default function ReconciliationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<any>(null)
  const [lines, setLines] = useState<ParsedLine[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [selectedLine, setSelectedLine] = useState<ParsedLine | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await authFetch(`/api/invoices/${invoiceId}/parsed`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setInvoice(data.data.header)
        setLines(data.data.lines)
      }
    } catch (error) {
      toast({
        title: "Error loading invoice",
        description: "Failed to load invoice data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async (query: string) => {
    if (query.length < 2) return
    
    try {
      const response = await authFetch(`/api/invoices/products/search?q=${encodeURIComponent(query)}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data.products)
      }
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const handleMatch = async (lineId: string, productId: string) => {
    try {
      const response = await authFetch(`/api/invoices/${invoiceId}/lines/${lineId}/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          product_id: productId,
          action: "match"
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Match successful",
          description: "Product matched successfully"
        })
        fetchInvoice()
        setSelectedLine(null)
      }
    } catch (error) {
      toast({
        title: "Match failed",
        description: "Failed to match product",
        variant: "destructive"
      })
    }
  }

  const handleAutoMatch = async () => {
    try {
      const response = await authFetch(`/api/invoices/${invoiceId}/auto-match`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Auto-match complete",
          description: `Matched ${data.data.matched_count} lines`
        })
        fetchInvoice()
      }
    } catch (error) {
      toast({
        title: "Auto-match failed",
        variant: "destructive"
      })
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const response = await authFetch(`/api/invoices/${invoiceId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          shop_id: invoice.shop_id,
          auto_allocate: true
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Invoice confirmed",
          description: "GRN created and inventory updated"
        })
        router.push("/purchases")
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Confirmation failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setConfirming(false)
    }
  }

  const getStatusBadge = (status: string, confidence?: number) => {
    if (status === "matched") {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Matched</Badge>
    } else if (status === "needs_review") {
      return <Badge variant="warning"><AlertCircle className="h-3 w-3 mr-1" />Review ({(confidence || 0) * 100}%)</Badge>
    } else {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Unmatched</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const matchedCount = lines.filter(l => l.status === "matched").length
  const needsReview = lines.filter(l => l.status === "needs_review").length
  const canConfirm = needsReview === 0 && matchedCount > 0

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Invoice Reconciliation</h1>
        <p className="text-muted-foreground mt-2">
          Review and confirm product matches
        </p>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>Invoice #{invoice?.invoice_number}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Lines</p>
              <p className="text-2xl font-bold">{lines.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matched</p>
              <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-2xl font-bold text-yellow-600">{needsReview}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">₹{invoice?.total_amount?.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={handleAutoMatch}>
          Auto-Match High Confidence
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push("/purchases")}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || confirming}
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirm & Create GRN
              </>
            )}
          </Button>
        </div>
      </div>

      {!canConfirm && needsReview > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {needsReview} line(s) need manual review before confirmation
          </AlertDescription>
        </Alert>
      )}

      {/* Lines Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-32">Unit Price</TableHead>
                <TableHead className="w-32">Total</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.line_id}>
                  <TableCell>{line.line_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{line.description}</p>
                      {line.batch_no && (
                        <p className="text-xs text-muted-foreground">
                          Batch: {line.batch_no} | Expiry: {line.expiry_date}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{line.qty}</TableCell>
                  <TableCell>₹{line.unit_price?.toFixed(2)}</TableCell>
                  <TableCell>₹{line.line_total?.toFixed(2)}</TableCell>
                  <TableCell>
                    {getStatusBadge(line.status, line.match_confidence)}
                  </TableCell>
                  <TableCell>
                    {line.status !== "matched" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLine(line)
                              setSearchQuery(line.description)
                              searchProducts(line.description)
                            }}
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Match
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Match Product</DialogTitle>
                            <DialogDescription>
                              Search and select the correct product for: {line.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value)
                                searchProducts(e.target.value)
                              }}
                            />
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {searchResults.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-3 border rounded hover:bg-accent cursor-pointer"
                                  onClick={() => handleMatch(line.line_id, product.id)}
                                >
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      SKU: {product.sku} | ₹{product.price}
                                    </p>
                                  </div>
                                  <Button size="sm">Select</Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
