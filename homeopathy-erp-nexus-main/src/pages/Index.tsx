import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Database, 
  ClipboardList, 
  Package, 
  Users, 
  Calendar,
  Settings,
  FileText,
  Truck,
  Send,
  Award,
  Mail,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            YEELO HOMEOPATHY
          </h1>
          <h2 className="text-2xl font-semibold text-muted-foreground mt-2 mb-4">
            Complete ERP Management System
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Advanced homeopathy pharmacy management with batch tracking, potency management, inventory control, and comprehensive business operations.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link to="/dashboard">
                <Button className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md">
                  <Calendar className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link to="/sales">
                <Button variant="outline" className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  New Sale
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/inventory" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Database className="mr-2 h-5 w-5" />
                  Inventory Management
                </CardTitle>
                <CardDescription>
                  Batch-wise stock tracking with expiry alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Track homeopathy medicine batches, potencies, forms, and expiry dates with automated alerts and FIFO stock management.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sales" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  POS & Sales
                </CardTitle>
                <CardDescription>
                  Retail & wholesale billing with batch selection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Process sales with batch selection, automatic pricing, GST calculation, returns, and credit note management.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/purchase" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Package className="mr-2 h-5 w-5" />
                  Purchase Orders
                </CardTitle>
                <CardDescription>
                  Supplier management with discount tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Create purchase orders, manage supplier relationships, track discounts, and handle incoming inventory with batch details.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/customers" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Users className="mr-2 h-5 w-5" />
                  Customer Management
                </CardTitle>
                <CardDescription>
                  Patient profiles with prescription history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Manage customer details, purchase history, outstanding balances, and prescription tracking for homeopathy patients.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/loyalty" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Award className="mr-2 h-5 w-5" />
                  Loyalty Program
                </CardTitle>
                <CardDescription>
                  Points-based rewards system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Reward regular customers with points, create loyalty tiers, and offer special discounts for homeopathy treatments.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/prescriptions" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <FileText className="mr-2 h-5 w-5" />
                  Prescription Management
                </CardTitle>
                <CardDescription>
                  Digital prescriptions with refill reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Store digital prescriptions, set up refill reminders, track medication histories, and manage homeopathy treatment plans.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/daily-billing" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Quick Billing
                </CardTitle>
                <CardDescription>
                  Fast barcode scanning & POS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Barcode scanning for quick billing, walk-in customer processing, and real-time daily sales dashboard.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/gst" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <FileText className="mr-2 h-5 w-5" />
                  GST & Compliance
                </CardTitle>
                <CardDescription>
                  E-invoice & automated tax filing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Generate e-invoices, e-way bills, file GST returns, and ensure full tax compliance for pharmacy operations.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/business-intelligence" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Business Intelligence
                </CardTitle>
                <CardDescription>
                  AI-powered analytics & insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Advanced analytics, predictive insights, sales forecasting, and comprehensive business performance dashboards.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/marketing" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Send className="mr-2 h-5 w-5" />
                  Marketing Automation
                </CardTitle>
                <CardDescription>
                  WhatsApp, SMS & social campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Create targeted marketing campaigns via WhatsApp and SMS, segment customers, and track engagement analytics.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/email" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Management
                </CardTitle>
                <CardDescription>
                  Professional email communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Send personalized emails, manage templates, track communications, and maintain professional patient correspondence.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/delivery" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Truck className="mr-2 h-5 w-5" />
                  Delivery Management
                </CardTitle>
                <CardDescription>
                  Order tracking & delivery zones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Manage delivery staff, track order status, define delivery zones, and provide real-time delivery updates to customers.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/reports" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Advanced Reports
                </CardTitle>
                <CardDescription>
                  Comprehensive business analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Generate detailed sales reports, inventory analysis, financial statements, and business performance metrics.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/master" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Layers className="mr-2 h-5 w-5" />
                  Master Data
                </CardTitle>
                <CardDescription>
                  Products, brands & system configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Configure homeopathy products, brands, categories, suppliers, potencies, and other core reference data.</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/settings" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Settings className="mr-2 h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Database, users & system preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Configure database connections, user permissions, tax rates, system preferences, and integration settings.</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 YEELO HOMEOPATHY - Complete ERP Management System for Homeopathy Pharmacies
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Features: Batch Management • Potency Tracking • GST Compliance • Multi-Database Support
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;