"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BARCODE_TEMPLATES, getBarcodeTemplate } from "@/lib/barcode-templates";
import { BarcodeTemplateSelector } from "@/components/barcode/BarcodeTemplateSelector";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Eye, ArrowLeft, Package, Barcode } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BarcodeTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState("BarcodeT8");
  const [productName, setProductName] = useState("Sample Product");
  const [productCode, setProductCode] = useState("P-0001");
  const [mrp, setMRP] = useState(70.00);
  const [salePrice, setSalePrice] = useState(70.00);
  const [batchNo, setBatchNo] = useState("B001");
  const [brand, setBrand] = useState("RAINTECH");

  const template = getBarcodeTemplate(selectedTemplate);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button 
          onClick={() => router.push('/products')}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <Package className="w-4 h-4" />
          Products
        </button>
        <span>/</span>
        <button 
          onClick={() => router.push('/products/barcode')}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <Barcode className="w-4 h-4" />
          Barcode Management
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Templates</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcode Template Manager</h1>
          <p className="text-muted-foreground mt-2">
            Choose the right barcode template for different bottle sizes and product types
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/products/barcode')}
          >
            <Barcode className="w-4 h-4 mr-2" />
            Print Barcodes
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{BARCODE_TEMPLATES.length}</div>
            <p className="text-xs text-muted-foreground">Available templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Size Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">40mm - 110mm</div>
            <p className="text-xs text-muted-foreground">Width range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{template?.name.split(' - ')[1]}</div>
            <p className="text-xs text-muted-foreground">{template?.width}mm × {template?.height}mm</p>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            Customize the preview data to see how your barcode will look
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="productCode">Product Code</Label>
              <Input
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="Enter product code"
              />
            </div>
            <div>
              <Label htmlFor="batchNo">Batch Number</Label>
              <Input
                id="batchNo"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="Enter batch number"
              />
            </div>
            <div>
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input
                id="mrp"
                type="number"
                value={mrp}
                onChange={(e) => setMRP(parseFloat(e.target.value))}
                placeholder="Enter MRP"
              />
            </div>
            <div>
              <Label htmlFor="salePrice">Sale Price (₹)</Label>
              <Input
                id="salePrice"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value))}
                placeholder="Enter sale price"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand Name</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
          </div>

          {template && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="scale-150 origin-center">
                  <LargeBarcodePreview
                    template={template}
                    productName={productName}
                    productCode={productCode}
                    batchNo={batchNo}
                    mrp={mrp}
                    salePrice={salePrice}
                    brand={brand}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Template</CardTitle>
          <CardDescription>
            Choose from {BARCODE_TEMPLATES.length} pre-designed templates for different bottle sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeTemplateSelector
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            productName={productName}
            productCode={productCode}
            mrp={mrp}
            salePrice={salePrice}
          />
        </CardContent>
      </Card>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Template Usage Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Small Bottles (10ml - 20ml)</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>BarcodeT1</Badge>
                <Badge>BarcodeT2</Badge>
                <Badge>BarcodeT3</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Compact layouts with essential information only
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Medium Bottles (30ml - 100ml)</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>BarcodeT5</Badge>
                <Badge>BarcodeT6</Badge>
                <Badge>BarcodeT7</Badge>
                <Badge variant="secondary">BarcodeT8</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Standard layouts with QR code and full details
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Large Bottles (100ml+)</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>BarcodeT9</Badge>
                <Badge>BarcodeT10</Badge>
                <Badge>BarcodeT11</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Large layouts with bigger fonts and QR codes
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Special Products</h4>
              <div className="flex flex-wrap gap-2">
                <Badge>BarcodeT13</Badge>
                <Badge>BarcodeT14</Badge>
                <Badge>BarcodeT15</Badge>
                <Badge>BarcodeT16</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Specialized layouts for tablets, creams, MT, bio combinations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LargeBarcodePreviewProps {
  template: any;
  productName: string;
  productCode: string;
  batchNo: string;
  mrp: number;
  salePrice: number;
  brand: string;
}

function LargeBarcodePreview({
  template,
  productName,
  productCode,
  batchNo,
  mrp,
  salePrice,
  brand,
}: LargeBarcodePreviewProps) {
  const { layout } = template;

  return (
    <div
      className="relative bg-white border-2 border-gray-300 shadow-lg"
      style={{
        width: `${template.width * 3}px`,
        height: `${template.height * 3}px`,
      }}
    >
      <div className="p-3 h-full flex flex-col justify-between text-black">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {layout.showProductName && (
              <div className={`font-bold ${layout.fontSize === 'large' ? 'text-lg' : layout.fontSize === 'medium' ? 'text-base' : 'text-sm'}`}>
                {productName}
              </div>
            )}
            {layout.showProductCode && (
              <div className={`text-gray-600 ${layout.fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                Code: {productCode}
              </div>
            )}
            {layout.showBatchNo && (
              <div className={`text-gray-500 ${layout.fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                Batch: {batchNo}
              </div>
            )}
          </div>
          {layout.showQRCode && (
            <div className="ml-2">
              <div
                className="bg-black"
                style={{
                  width: layout.fontSize === 'small' ? '40px' : layout.fontSize === 'medium' ? '50px' : '60px',
                  height: layout.fontSize === 'small' ? '40px' : layout.fontSize === 'medium' ? '50px' : '60px',
                }}
              />
            </div>
          )}
        </div>

        {/* Middle Section - Prices */}
        <div className="flex justify-between items-center my-2">
          <div>
            {layout.showMRP && (
              <div className={`font-semibold ${layout.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                MRP: ₹{mrp.toFixed(2)}
              </div>
            )}
            {layout.showSalePrice && (
              <div className={`font-bold ${layout.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
                Sale Price: ₹{salePrice.toFixed(2)}
              </div>
            )}
          </div>
          {layout.showSize && (
            <div className={`text-gray-600 font-semibold ${layout.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
              {template.width}MM
            </div>
          )}
        </div>

        {/* Bottom Section - Barcode */}
        {layout.showBarcode && (
          <div className="flex flex-col items-center">
            <div
              className="w-full"
              style={{
                height: layout.fontSize === 'small' ? '30px' : layout.fontSize === 'medium' ? '40px' : '50px',
                background: 'repeating-linear-gradient(90deg, black 0px, black 2px, white 2px, white 4px)',
              }}
            />
            <div className={`text-center mt-1 font-mono ${layout.fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>
              {productCode}
            </div>
          </div>
        )}

        {/* Brand */}
        {layout.showBrand && (
          <div className={`text-right font-bold mt-1 ${layout.fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
            {brand}
          </div>
        )}
      </div>

      {/* Size indicator */}
      <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-gray-500 font-semibold">
        {template.width}mm × {template.height}mm
      </div>
    </div>
  );
}
