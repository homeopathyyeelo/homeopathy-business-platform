
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import ProductMaster from "@/components/master/ProductMaster";
import CustomerMaster from "@/components/master/CustomerMaster";
import SupplierMaster from "@/components/master/SupplierMaster";
import CategoryMaster from "@/components/master/CategoryMaster";
import UnitMaster from "@/components/master/UnitMaster";
import TaxMaster from "@/components/master/TaxMaster";
import BrandManagement from "@/components/master/BrandManagement";
import { Database, Users, Truck, FolderTree, Ruler, Percent, Tag } from "lucide-react";

const MasterManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Master Management</h2>
        <p className="text-muted-foreground">
          Manage your products, customers, suppliers, categories, units, brands, and tax rates.
        </p>
      </div>
      
      <Tabs defaultValue="products" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="w-full max-w-5xl grid grid-cols-7 mb-4">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Customers</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              <span>Categories</span>
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Brands</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span>Units</span>
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              <span>Taxes</span>
            </TabsTrigger>
          </TabsList>
        </ScrollArea>
        
        <Card>
          <CardHeader className="bg-muted/50 border-b p-4">
            <TabsContent value="products">
              <CardTitle>Product Master</CardTitle>
              <CardDescription>Manage medicine inventory with HSN codes, GST rates, and more</CardDescription>
            </TabsContent>
            
            <TabsContent value="customers">
              <CardTitle>Customer Master</CardTitle>
              <CardDescription>Manage retail and wholesale customers with pricing levels and credit limits</CardDescription>
            </TabsContent>
            
            <TabsContent value="suppliers">
              <CardTitle>Supplier Master</CardTitle>
              <CardDescription>Track vendor information, contacts, and outstanding balances</CardDescription>
            </TabsContent>
            
            <TabsContent value="categories">
              <CardTitle>Category Master</CardTitle>
              <CardDescription>Organize products into hierarchical categories and subcategories</CardDescription>
            </TabsContent>
            
            <TabsContent value="brands">
              <CardTitle>Brand Master</CardTitle>
              <CardDescription>Manage product brands and manufacturers like SBL, Schwabe, Bakson</CardDescription>
            </TabsContent>
            
            <TabsContent value="units">
              <CardTitle>Unit Master</CardTitle>
              <CardDescription>Define measurement units like tablets, bottles, strips, and milliliters</CardDescription>
            </TabsContent>
            
            <TabsContent value="taxes">
              <CardTitle>Tax Master</CardTitle>
              <CardDescription>Configure GST rates and other applicable taxes</CardDescription>
            </TabsContent>
          </CardHeader>
          
          <TabsContent value="products" className="mt-0">
            <ProductMaster />
          </TabsContent>
          
          <TabsContent value="customers" className="mt-0">
            <CustomerMaster />
          </TabsContent>
          
          <TabsContent value="suppliers" className="mt-0">
            <SupplierMaster />
          </TabsContent>
          
          <TabsContent value="categories" className="mt-0">
            <CategoryMaster />
          </TabsContent>
          
          <TabsContent value="brands" className="mt-0">
            <BrandManagement />
          </TabsContent>
          
          <TabsContent value="units" className="mt-0">
            <UnitMaster />
          </TabsContent>
          
          <TabsContent value="taxes" className="mt-0">
            <TaxMaster />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default MasterManagement;
