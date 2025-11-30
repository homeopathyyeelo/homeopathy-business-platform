"use client";

import { useState } from "react";
import { BARCODE_TEMPLATES, BarcodeTemplate } from "@/lib/barcode-templates";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BarcodeTemplateSelectorProps {
  value?: string;
  onChange: (templateId: string) => void;
  productName?: string;
  productCode?: string;
  mrp?: number;
  salePrice?: number;
}

export function BarcodeTemplateSelector({
  value = "BarcodeT8",
  onChange,
  productName = "Sample Product",
  productCode = "P-0001",
  mrp = 70.00,
  salePrice = 70.00,
}: BarcodeTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(value);

  const handleSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    onChange(templateId);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Select Barcode Template</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the appropriate template based on your product bottle size
        </p>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <RadioGroup value={selectedTemplate} onValueChange={handleSelect}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BARCODE_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => handleSelect(template.id)}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value={template.id} id={template.id} />
                  <div className="flex-1 space-y-2">
                    <Label
                      htmlFor={template.id}
                      className="font-semibold cursor-pointer"
                    >
                      {template.name}
                    </Label>
                    
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {template.width}mm × {template.height}mm
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.layout.fontSize}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>

                    <p className="text-xs font-medium text-primary">
                      Best for: {template.suitableFor}
                    </p>

                    {/* Preview */}
                    <div className="mt-3 border rounded p-2 bg-white">
                      <BarcodePreview
                        template={template}
                        productName={productName}
                        productCode={productCode}
                        mrp={mrp}
                        salePrice={salePrice}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </ScrollArea>
    </div>
  );
}

interface BarcodePreviewProps {
  template: BarcodeTemplate;
  productName: string;
  productCode: string;
  mrp: number;
  salePrice: number;
}

function BarcodePreview({
  template,
  productName,
  productCode,
  mrp,
  salePrice,
}: BarcodePreviewProps) {
  const { layout } = template;
  
  const fontSizeClass = {
    small: "text-[6px]",
    medium: "text-[8px]",
    large: "text-[10px]",
  }[layout.fontSize];

  const barcodeHeight = {
    small: "h-8",
    medium: "h-10",
    large: "h-12",
  }[layout.fontSize];

  return (
    <div
      className={`relative bg-white border ${fontSizeClass}`}
      style={{
        width: `${template.width * 2}px`,
        height: `${template.height * 2}px`,
        fontSize: layout.fontSize === 'small' ? '6px' : layout.fontSize === 'medium' ? '8px' : '10px',
      }}
    >
      <div className="p-1 h-full flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {layout.showProductName && (
              <div className="font-bold truncate">{productName}</div>
            )}
            {layout.showProductCode && (
              <div className="text-gray-600">Code: {productCode}</div>
            )}
            {layout.showBatchNo && (
              <div className="text-gray-500">Batch: B001</div>
            )}
          </div>
          {layout.showQRCode && (
            <div className="ml-1">
              <div
                className="bg-black"
                style={{
                  width: layout.fontSize === 'small' ? '20px' : layout.fontSize === 'medium' ? '24px' : '28px',
                  height: layout.fontSize === 'small' ? '20px' : layout.fontSize === 'medium' ? '24px' : '28px',
                }}
              />
            </div>
          )}
        </div>

        {/* Middle Section - Prices */}
        <div className="flex justify-between items-center">
          <div>
            {layout.showMRP && (
              <div className="font-semibold">MRP: ₹{mrp.toFixed(2)}</div>
            )}
            {layout.showSalePrice && (
              <div className="font-bold">Sale: ₹{salePrice.toFixed(2)}</div>
            )}
          </div>
          {layout.showSize && (
            <div className="text-gray-600">{template.width}MM</div>
          )}
        </div>

        {/* Bottom Section - Barcode */}
        {layout.showBarcode && (
          <div className="flex flex-col items-center">
            <div className={`w-full bg-black ${barcodeHeight}`} style={{
              background: 'repeating-linear-gradient(90deg, black 0px, black 1px, white 1px, white 2px)',
            }} />
            <div className="text-center mt-0.5">{productCode}</div>
          </div>
        )}

        {/* Brand */}
        {layout.showBrand && (
          <div className="text-right font-semibold mt-0.5">RAINTECH</div>
        )}
      </div>

      {/* Size indicator */}
      <div className="absolute -bottom-4 left-0 right-0 text-center text-[8px] text-gray-400">
        {template.width}mm × {template.height}mm
      </div>
    </div>
  );
}
