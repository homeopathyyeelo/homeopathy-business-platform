"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, QrCode, Link2 } from "lucide-react";

export default function CataloguePage() {
  const [products, setProducts] = useState([
    { id: 1, name: "Arnica 30C", category: "Dilution", price: 150, stock: 50, image: "/product1.jpg" },
    { id: 2, name: "Belladonna 200C", category: "Dilution", price: 200, stock: 30, image: "/product2.jpg" },
  ]);

  const generateCatalogue = () => {
    const catalogueUrl = `https://homeoerp.app/catalogue/shop-${Date.now()}`;
    navigator.clipboard.writeText(catalogueUrl);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Digital Catalogue</h1>
          <p className="text-muted-foreground">Share product catalogue via WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </Button>
          <Button onClick={generateCatalogue}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Views This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
                <h3 className="font-semibold">{product.name}</h3>
                <Badge variant="outline" className="my-2">{product.category}</Badge>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold">₹{product.price}</span>
                  <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
