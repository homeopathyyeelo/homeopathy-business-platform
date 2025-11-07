"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, AlertTriangle, CheckCircle, RefreshCw, Download, FileText, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { authFetch } from '@/lib/api/fetch-utils';

const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005'

const fetcher = (url: string) => 
  fetch(`${API_URL}${url}`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  }).then(r => r.json())

interface ExpiryWindow {
  window_label: string
  window_days: number
  count_items: number
  count_batches: number
  total_value: number
  sample_products: any[]
  computed_at: string
}

interface ExpiryAlert {
  id: string
  product_id: string
  product_name: string
  sku: string
  batch_no: string
  expiry_date: string
  days_to_expiry: number
  alert_level: string
  qty_available: number
  total_value: number
  status: string
}

export default function ExpiryDashboardPage() {
  const { toast } = useToast()
  const [shopId, setShopId] = useState<string>("")
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null)
  
  useEffect(() => {
    const sid = localStorage.getItem("shop_id") || "11111111-1111-1111-1111-111111111111"
    setShopId(sid)
  }, [])

  const { data, error, mutate, isLoading } = useSWR(
    shopId ? `/api/v2/inventory/expiries?shop_id=${shopId}` : null,
    fetcher,
    { refreshInterval: 300000 }
  )

  const handleRefresh = async () => {
    try {
      const res = await authFetch(`/api/v2/inventory/expiries/refresh?shop_id=${shopId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      })
      if (res.ok) {
        toast({
          title: "Refreshed",
          description: "Expiry data refreshed successfully"
        })
        mutate()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      })
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load expiry data. Please check if the API service is running.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading expiry dashboard...</p>
        </div>
      </div>
    )
  }

  const windows = (data.data || []) as ExpiryWindow[]
  const totalExpiring = windows.reduce((sum, w) => sum + w.count_items, 0)
  const totalValue = windows.reduce((sum, w) => sum + (w.total_value || 0), 0)
  const criticalCount = windows.find(w => w.window_label === "7_days")?.count_items || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expiry Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor products approaching expiry across all time windows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expiring</p>
                <p className="text-3xl font-bold">{totalExpiring}</p>
              </div>
              <Package className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical (7 Days)</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold">₹{totalValue.toFixed(0)}</p>
              </div>
              <FileText className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {windows[0]?.computed_at ? new Date(windows[0].computed_at).toLocaleTimeString() : "N/A"}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiry Windows Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Expiry Windows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {windows.map((window) => (
            <ExpiryWindowCard 
              key={window.window_label} 
              window={window}
              onClick={() => setSelectedWindow(window.window_label)}
              isSelected={selectedWindow === window.window_label}
            />
          ))}
        </div>
      </div>

      {/* Critical Alerts Section */}
      {criticalCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts - Expiring in 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CriticalAlertsList shopId={shopId} />
          </CardContent>
        </Card>
      )}

      {/* Detailed Alerts Table */}
      {selectedWindow && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detailed Alerts - {formatWindowLabel(selectedWindow)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailedAlertsTable shopId={shopId} window={selectedWindow} />
          </CardContent>
        </Card>
      )}

      {/* Invoice Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Supplier Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a PDF invoice to automatically update batch expiry dates and stock levels.
            The system will parse the invoice and update inventory accordingly.
          </p>
          <InvoiceUploadForm shopId={shopId} onSuccess={() => mutate()} />
        </CardContent>
      </Card>
    </div>
  )
}

function ExpiryWindowCard({ window, onClick, isSelected }: { 
  window: ExpiryWindow
  onClick: () => void
  isSelected: boolean
}) {
  const getAlertColor = (label: string) => {
    if (label === "7_days") return "bg-red-500"
    if (label === "1_month") return "bg-orange-500"
    if (label === "2_months" || label === "3_months") return "bg-yellow-500"
    return "bg-blue-500"
  }

  return (
    <Card 
      className={`hover:shadow-lg transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{formatWindowLabel(window.window_label)}</h3>
            <p className="text-sm text-muted-foreground">Items expiring</p>
          </div>
          <div className={`${getAlertColor(window.window_label)} text-white text-2xl font-bold rounded-full w-12 h-12 flex items-center justify-center`}>
            {window.count_items}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Batches:</span>
            <span className="font-medium">{window.count_batches}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Value:</span>
            <span className="font-medium">₹{(window.total_value || 0).toFixed(2)}</span>
          </div>
        </div>

        {window.sample_products && window.sample_products.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-xs font-semibold mb-2">Sample Items:</h4>
            <ul className="space-y-1">
              {window.sample_products.slice(0, 3).map((item: any, idx: number) => (
                <li key={idx} className="text-xs flex justify-between">
                  <span className="truncate flex-1">{item.product_name || "Unknown"}</span>
                  <span className="text-muted-foreground ml-2">{item.days_to_expiry}d</span>
                </li>
              ))}
            </ul>
            {window.sample_products.length > 3 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{window.sample_products.length - 3} more items
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CriticalAlertsList({ shopId }: { shopId: string }) {
  const { data, isLoading } = useSWR(
    `/api/v2/inventory/expiries/alerts?shop_id=${shopId}&window=7_days&alert_level=critical&limit=10`,
    fetcher
  )

  if (isLoading) {
    return <div className="text-center py-4">Loading critical alerts...</div>
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p className="text-green-700 font-medium">No critical alerts!</p>
        <p className="text-sm text-muted-foreground">All products are safe for now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.data.map((alert: ExpiryAlert) => (
        <div key={alert.id} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded hover:bg-red-50">
          <div className="flex-1">
            <p className="font-medium text-red-900">{alert.product_name}</p>
            <p className="text-sm text-red-700">
              SKU: {alert.sku} | Batch: {alert.batch_no}
            </p>
            <p className="text-xs text-muted-foreground">
              Expires: {alert.expiry_date} ({alert.days_to_expiry} days remaining)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <Badge variant="destructive">{alert.qty_available} units</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{alert.total_value?.toFixed(2)}
              </p>
            </div>
            <Button size="sm" variant="outline">
              Action
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailedAlertsTable({ shopId, window }: { shopId: string, window: string }) {
  const { data, isLoading } = useSWR(
    `/api/v2/inventory/expiries/alerts?shop_id=${shopId}&window=${window}&limit=50`,
    fetcher
  )

  if (isLoading) {
    return <div className="text-center py-4">Loading alerts...</div>
  }

  if (!data || !data.data || data.data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No alerts for this window</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Batch</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Days Left</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.data.map((alert: ExpiryAlert) => (
          <TableRow key={alert.id}>
            <TableCell className="font-medium">{alert.product_name}</TableCell>
            <TableCell>{alert.sku}</TableCell>
            <TableCell>{alert.batch_no}</TableCell>
            <TableCell>{alert.expiry_date}</TableCell>
            <TableCell>
              <Badge variant={alert.days_to_expiry <= 7 ? "destructive" : "warning"}>
                {alert.days_to_expiry}d
              </Badge>
            </TableCell>
            <TableCell>{alert.qty_available}</TableCell>
            <TableCell>₹{alert.total_value?.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant="outline">{alert.status}</Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="ghost">Resolve</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function InvoiceUploadForm({ shopId, onSuccess }: { shopId: string, onSuccess: () => void }) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [vendorId, setVendorId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !vendorId) {
      toast({
        title: "Missing information",
        description: "Please select a file and vendor",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("shop_id", shopId)
    formData.append("vendor_id", vendorId)
    formData.append("source", "expiry_dashboard")

    try {
      const res = await authFetch("/api/invoices/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast({
          title: "Upload successful",
          description: `Invoice uploaded. Parsing ${data.data.lines_count} lines in background.`
        })
        setFile(null)
        setVendorId("")
        onSuccess()
        
        // Redirect to reconciliation after 2 seconds
        setTimeout(() => {
          window.location.href = `/purchases/reconciliation/${data.data.parsed_invoice_id}`
        }, 2000)
      } else {
        throw new Error(data.error || "Upload failed")
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Vendor</label>
        <select
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select vendor...</option>
          <option value="33333333-3333-3333-3333-333333333333">SBL Pharmaceuticals</option>
          <option value="44444444-4444-4444-4444-444444444444">Dr. Reckeweg & Co.</option>
        </select>
      </div>

      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        {file ? (
          <div>
            <FileText className="h-12 w-12 mx-auto mb-2 text-primary" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              className="mt-2"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PDF files only (Max 10MB)
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="invoice-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("invoice-upload")?.click()}
            >
              Select PDF
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" disabled={!file || !vendorId || uploading} className="w-full">
        {uploading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Uploading & Parsing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload & Parse Invoice
          </>
        )}
      </Button>
    </form>
  )
}

function formatWindowLabel(label: string): string {
  const labels: Record<string, string> = {
    "7_days": "7 Days",
    "1_month": "1 Month",
    "2_months": "2 Months",
    "3_months": "3 Months",
    "6_months": "6 Months",
    "1_year": "1 Year",
    "60_months": "60 Months (5 Years)"
  }
  return labels[label] || label
}
