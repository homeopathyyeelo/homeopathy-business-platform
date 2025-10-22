'use client'

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Globe, Languages, DollarSign, FileCheck, Shield, Truck } from "lucide-react"

export default function InternationalExpansion() {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState("USA")
  const [targetCurrency, setTargetCurrency] = useState("USD")
  const [targetLanguage, setTargetLanguage] = useState("en")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/masters')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Masters
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">International Expansion</h2>
            <p className="text-gray-600">Global market expansion with multi-currency, multi-language, and international compliance</p>
          </div>
        </div>
      </div>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Target Market Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Target Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="UAE">UAE</SelectItem>
                  <SelectItem value="Singapore">Singapore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target Currency</label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                  <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                  <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                  <SelectItem value="SGD">Singapore Dollar (SGD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Currency Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Multi-Currency Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded">
                <h4 className="font-medium">Arnica Montana 30C</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">INR (Base)</span>
                    <span className="font-medium">45.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">USD</span>
                    <span className="font-medium">$0.54</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">EUR</span>
                    <span className="font-medium">0.48</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded">
                <h4 className="font-medium">Nux Vomica 200C</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">INR (Base)</span>
                    <span className="font-medium">65.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">USD</span>
                    <span className="font-medium">$0.78</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">GBP</span>
                    <span className="font-medium">0.62</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* International Regulations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCheck className="w-5 h-5 mr-2" />
            International Regulations Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded">
                <h4 className="font-medium flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  FDA Compliance (USA)
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">Compliant</Badge>
                    <span className="text-sm">Homeopathic Pharmacopoeia standards met</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">Compliant</Badge>
                    <span className="text-sm">Labeling requirements satisfied</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded">
                <h4 className="font-medium flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-yellow-600" />
                  EU Compliance
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-yellow-600">Review Required</Badge>
                    <span className="text-sm">CE marking for medical devices</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">Compliant</Badge>
                    <span className="text-sm">Good Manufacturing Practice (GMP)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Supply Chain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Global Supply Chain Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded">
              <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">Multi-Country Warehousing</h4>
              <p className="text-sm text-gray-600">Strategic warehouses in USA, EU, Asia-Pacific</p>
            </div>
            <div className="text-center p-4 border rounded">
              <Truck className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">International Shipping</h4>
              <p className="text-sm text-gray-600">DHL, FedEx, UPS integration for global delivery</p>
            </div>
            <div className="text-center p-4 border rounded">
              <FileCheck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium">Customs Compliance</h4>
              <p className="text-sm text-gray-600">Automated customs documentation and declarations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Localization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Languages className="w-5 h-5 mr-2" />
            Multi-Language Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Supported Languages</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">English</span>
                  <Badge>Primary</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Spanish</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">French</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">German</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Arabic</span>
                  <Badge variant="outline">Available</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Localized Content</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Product Descriptions</p>
                  <p className="text-xs text-gray-600">Translated product information and therapeutic uses</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Regulatory Labels</p>
                  <p className="text-xs text-gray-600">Country-specific labeling requirements</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Customer Support</p>
                  <p className="text-xs text-gray-600">Multi-language customer service interface</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* International Tax Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>International Tax & Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Tax Compliance by Country</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">United States</span>
                  <Badge className="text-green-700 bg-green-100">Compliant</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm">European Union</span>
                  <Badge className="text-yellow-700 bg-yellow-100">Review Needed</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">United Kingdom</span>
                  <Badge className="text-green-700 bg-green-100">Compliant</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Australia</span>
                  <Badge className="text-blue-700 bg-blue-100">In Progress</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Automated Tax Calculations</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">VAT/GST Calculation</p>
                  <p className="text-xs text-gray-600">Automatic tax calculation based on destination country</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Import Duty Calculation</p>
                  <p className="text-xs text-gray-600">Automated import duty and customs calculations</p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm font-medium">Tax Exemption Handling</p>
                  <p className="text-xs text-gray-600">Medical product tax exemptions where applicable</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Customer Support */}
      <Card>
        <CardHeader>
          <CardTitle>Global Customer Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <p className="text-sm text-gray-600">Global Support Coverage</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">15</div>
              <p className="text-sm text-gray-600">Supported Languages</p>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-600">98%</div>
              <p className="text-sm text-gray-600">Customer Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* International Expansion Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Expansion Management Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Market Analysis Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileCheck className="w-4 h-4 mr-2" />
                Compliance Checklist
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Languages className="w-4 h-4 mr-2" />
                Translation Management
              </Button>
            </div>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Currency Converter
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Truck className="w-4 h-4 mr-2" />
                Shipping Calculator
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Regulatory Updates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
