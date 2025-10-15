"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Leaf,
  BarChart3, 
  Package, 
  Receipt, 
  MessageCircle,
  ShoppingCart,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Brain,
  Mail,
  Truck,
  FileText,
  Database,
  Settings,
  Calculator,
  Award,
  FileCheck,
  Smartphone,
  Globe,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  const features = [
    {
      icon: BarChart3,
      title: "Dashboard",
      description: "Your intelligent control center. Monitor sales, stock levels, revenue trends, and alerts in real-time from a sleek, easy-to-use dashboard.",
      highlights: ["Real-time monitoring", "Revenue analytics", "Smart alerts"]
    },
    {
      icon: ShoppingCart,
      title: "New Sale & Billing (POS)",
      description: "Fast, intuitive billing system with barcode scanning support.",
      highlights: ["Quick walk-in billing", "Retail & wholesale support", "Auto tax calculations (GST-ready)", "Digital invoice generation"]
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Never run out of stock or miss expiry dates again.",
      highlights: ["Real-time stock tracking", "Batch & expiry management", "Low stock & expiry alerts", "AI-powered auto reorder suggestions"]
    },
    {
      icon: Receipt,
      title: "Sales Management",
      description: "Manage the full lifecycle of sales transactions.",
      highlights: ["Invoice tracking", "Returns & exchanges", "Credit/debit note management", "Sales history for every customer"]
    },
    {
      icon: Database,
      title: "Purchases & Supplier Management",
      description: "Stay on top of your purchases and vendor relationships.",
      highlights: ["Create and track purchase orders", "Supplier performance reports", "GRN and invoice matching", "Pending order alerts"]
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Delight customers with personalized service.",
      highlights: ["Complete customer profiles", "Purchase history", "Outstanding balance tracking", "Auto birthday & refill reminders"]
    },
    {
      icon: Award,
      title: "Loyalty Program",
      description: "Reward loyalty, increase retention.",
      highlights: ["Points-based loyalty setup", "Tiered rewards and discounts", "Loyalty history and redemption"]
    },
    {
      icon: FileCheck,
      title: "Prescription Management",
      description: "Handle prescriptions with ease and compliance.",
      highlights: ["Upload digital prescriptions", "Refill alerts", "Track medication history"]
    },
    {
      icon: Brain,
      title: "AI Business Intelligence",
      description: "Get data that works for you.",
      highlights: ["Predictive sales & demand forecasting", "Top-selling products analysis", "Visual dashboards & KPIs", "AI-driven stock optimization"]
    },
    {
      icon: MessageCircle,
      title: "Marketing (SMS, WhatsApp & Email)",
      description: "Reach your customers where they are.",
      highlights: ["Bulk WhatsApp campaigns", "SMS notifications", "Email marketing templates", "Campaign performance analytics"]
    },
    {
      icon: Truck,
      title: "Delivery Management",
      description: "Seamless delivery tracking and assignment.",
      highlights: ["Assign orders to delivery staff", "Track delivery status", "Geo-zoning & delivery slots", "Proof of delivery uploads"]
    },
    {
      icon: FileText,
      title: "Advanced Reports",
      description: "Make informed decisions with powerful reports.",
      highlights: ["Daily, weekly, monthly sales", "Inventory valuation & turnover", "Tax summaries & financial statements", "Profit margin & ROI analysis"]
    },
    {
      icon: Settings,
      title: "Master Data Management",
      description: "Control your pharmacy's foundation.",
      highlights: ["Manage products, brands, categories", "Supplier, customer, staff profiles", "Update pricing and attributes in bulk"]
    },
    {
      icon: Calculator,
      title: "GST & Compliance Automation",
      description: "Stay 100% compliant, effortlessly.",
      highlights: ["Auto GST calculation", "E-invoice & e-way bill generation", "GSTR-1, GSTR-3B ready", "Tax reports & returns support"]
    }
  ];

  const benefits = [
    { icon: CheckCircle, text: "Tailored for pharmacies and wellness stores" },
    { icon: Globe, text: "Cloud-enabled, accessible anywhere" },
    { icon: TrendingUp, text: "Boosts efficiency & reduces human error" },
    { icon: Brain, text: "AI-backed decision-making" },
    { icon: Smartphone, text: "24/7 support & regular updates" }
  ];

  useEffect(() => {
    document.title = "Features - Complete Homeopathy ERP System | Smart Pharmacy Management Suite";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Leaf className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Homeopathy ERP System
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            All-in-One Pharmacy Management Suite – Smart, Scalable, and Made for Growth
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Pharmacy Solution
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              AI-Powered Insights
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Package className="w-4 h-4 mr-2" />
              Smart Inventory Control
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Receipt className="w-4 h-4 mr-2" />
              GST Compliant & E-invoicing Ready
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <MessageCircle className="w-4 h-4 mr-2" />
              Built-in WhatsApp & SMS Marketing
            </Badge>
          </div>
          <p className="text-2xl font-semibold text-primary mb-8">
            🚀 Designed for Efficiency. Built for Growth.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/sales">Try Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Complete Feature Suite</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{feature.description}</CardDescription>
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Scalability */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Shield className="h-8 w-8 text-primary mr-3" />
                Secure & Scalable
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Role-based Access Control</h3>
                    <p className="text-muted-foreground">Manage user permissions and secure sensitive data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Cloud-based Data Backup</h3>
                    <p className="text-muted-foreground">Automatic backups ensure your data is always safe</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Multi-branch Support</h3>
                    <p className="text-muted-foreground">Scale from single store to chain operations</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-xl">
              <Zap className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">Why Choose Our ERP?</h3>
              <div className="space-y-3">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <span>{benefit.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Pharmacy Business?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of pharmacies already using our ERP system to boost efficiency and grow their business.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/dashboard">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/settings">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
