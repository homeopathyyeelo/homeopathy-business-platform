"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function InvoiceUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [vendorId, setVendorId] = useState("")
  const [shopId, setShopId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive"
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !vendorId || !shopId) {
      toast({
        title: "Missing information",
        description: "Please select a file, vendor, and shop",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("vendor_id", vendorId)
    formData.append("shop_id", shopId)
    formData.append("source", "manual")

    try {
      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setUploadResult(data.data)
        toast({
          title: "Upload successful",
          description: `Invoice parsed with ${data.data.lines_count} lines`
        })

        // Redirect to reconciliation after 2 seconds
        setTimeout(() => {
          router.push(`/purchases/reconciliation/${data.data.parsed_invoice_id}`)
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upload Vendor Invoice</h1>
        <p className="text-muted-foreground mt-2">
          Upload PDF invoices for automatic parsing and product matching
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Upload</CardTitle>
          <CardDescription>
            Upload a PDF invoice from your vendor. The system will automatically parse and match products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!uploadResult ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor-1">SBL Pharmaceuticals</SelectItem>
                    <SelectItem value="vendor-2">Dr. Reckeweg & Co.</SelectItem>
                    <SelectItem value="vendor-3">Allen Homeopathy</SelectItem>
                    <SelectItem value="vendor-4">Schwabe India</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop">Shop/Branch *</Label>
                <Select value={shopId} onValueChange={setShopId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop-1">Main Branch</SelectItem>
                    <SelectItem value="shop-2">Branch 2</SelectItem>
                    <SelectItem value="shop-3">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Invoice PDF *</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF files only (Max 10MB)
                      </p>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById("file")?.click()}
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The system will automatically parse the invoice, extract line items, and attempt to match products.
                  You can review and correct matches in the next step.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/purchases")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || !vendorId || !shopId || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading & Parsing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Invoice
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Invoice parsed with {uploadResult.lines_count} lines
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Confidence Score: {(uploadResult.confidence_score * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to reconciliation...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
