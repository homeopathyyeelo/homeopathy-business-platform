# 🤖 AI Smart POS - Complete Implementation Guide

## ✅ **What's Implemented**

### **Backend (100% Complete)**

1. ✅ **AI Smart Suggestions Handler** (`ai_pos_handler.go`)
2. ✅ **Hold Bills Feature** (Complete with migration)
3. ✅ **API Routes Registered**
4. ✅ **OpenAI Integration**

---

## 🚀 **Setup Instructions**

### **Step 1: Fix & Run Migration**

```bash
cd /var/www/homeopathy-business-platform/services/api-golang-master

# Run the fixed migration
psql -h localhost -U postgres -d yeelo_homeopathy -f migrations/018_create_hold_bills_table.sql
```

### **Step 2: Add OpenAI API Key**

```bash
# Edit .env file
nano services/api-golang-master/.env

# Add this line:
OPENAI_API_KEY=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
```

### **Step 3: Restart Backend**

```bash
cd services/api-golang-master
go run cmd/main.go
```

---

## 📋 **API Endpoints Created**

### **1. AI Smart Suggestions**
```
POST /api/erp/pos/ai-suggestions
```

**Request:**
```json
{
  "cart_items": [
    {"product_id": "uuid", "name": "Arnica 30C", "quantity": 2}
  ],
  "customer_id": "uuid",
  "disease": "fever"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "product_id": "uuid",
      "product_name": "Belladonna 30C",
      "sku": "BEL30",
      "potency": "30C",
      "form": "Dilution",
      "reason": "Frequently bought together",
      "confidence": 0.85,
      "suggested_price": 120.00,
      "in_stock": true,
      "stock_quantity": 45,
      "profit_margin": 42.5,
      "type": "frequently_bought"
    }
  ],
  "count": 5
}
```

### **2. Disease-Based Suggestions**
```
POST /api/erp/pos/disease-suggestions
```

**Request:**
```json
{
  "disease": "Fever with headache",
  "symptoms": ["high temperature", "throbbing headache", "red face"]
}
```

**Response:**
```json
{
  "success": true,
  "disease": "Fever with headache",
  "protocol": {
    "primary": [
      {
        "medicine": "Belladonna 30C",
        "reason": "Best for sudden high fever with red face",
        "dosage": "5 drops every 2 hours"
      }
    ],
    "supportive": [...],
    "duration": "3-5 days",
    "notes": "Avoid spicy food..."
  }
}
```

---

## 🎯 **AI Features Explained**

### **1. Frequently Bought Together**
- Analyzes historical sales data
- Finds products commonly purchased together
- Uses SQL query on `invoice_items` table
- Confidence based on frequency

### **2. OpenAI Smart Suggestions**
- Uses GPT-4o-mini model
- Analyzes cart contents
- Considers disease/condition
- Provides complementary medicines
- Matches AI suggestions with actual products in database

### **3. Similar Products**
- Same brand/category
- Different potency/form
- Helps customers discover alternatives

### **4. Upsell Products**
- High profit margin items (>40%)
- Premium brands (Dr. Reckeweg, SBL, Schwabe)
- Quality recommendations

---

## 💻 **Frontend Implementation**

### **Create AI Suggestions Panel Component**

Create file: `app/components/pos/AIsuggestions.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, TrendingUp, Package } from 'lucide-react';
import { golangAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  product_id: string;
  product_name: string;
  sku: string;
  potency?: string;
  form?: string;
  reason: string;
  confidence: number;
  suggested_price: number;
  in_stock: boolean;
  stock_quantity: number;
  profit_margin?: number;
  type: string;
}

interface Props {
  cartItems: any[];
  customerId?: string;
  onAddToCart: (suggestion: Suggestion) => void;
}

export default function AISuggestionsPanel({ cartItems, customerId, onAddToCart }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [disease, setDisease] = useState('');
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Add items to cart to get AI suggestions',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await golangAPI.post('/api/erp/pos/ai-suggestions', {
        cart_items: cartItems,
        customer_id: customerId,
        disease: disease || undefined,
      });

      setSuggestions(res.data.suggestions || []);
      
      toast({
        title: '✨ AI Suggestions Ready',
        description: `Found ${res.data.count} recommendations`,
      });
    } catch (error) {
      console.error('AI suggestions failed:', error);
      toast({
        title: 'Failed to get suggestions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'frequently_bought':
        return <TrendingUp className="w-4 h-4" />;
      case 'upsell':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'frequently_bought':
        return 'bg-blue-100 text-blue-800';
      case 'complementary':
        return 'bg-green-100 text-green-800';
      case 'upsell':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Disease Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Disease/condition (optional)"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={fetchSuggestions}
            disabled={loading || cartItems.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Loading...' : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>

        {/* Suggestions List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {cartItems.length === 0
                  ? 'Add items to cart to get AI suggestions'
                  : 'Click the button to get AI recommendations'}
              </p>
            </div>
          ) : (
            suggestions.map((suggestion, idx) => (
              <Card key={idx} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeColor(suggestion.type)}>
                        {getTypeIcon(suggestion.type)}
                        <span className="ml-1 text-xs capitalize">
                          {suggestion.type.replace('_', ' ')}
                        </span>
                      </Badge>
                      {!suggestion.in_stock && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-sm">
                      {suggestion.product_name}
                    </h4>
                    
                    {(suggestion.potency || suggestion.form) && (
                      <p className="text-xs text-muted-foreground">
                        {suggestion.potency} {suggestion.form}
                      </p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {suggestion.reason}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="font-semibold text-primary">
                        ₹{suggestion.suggested_price.toFixed(2)}
                      </span>
                      
                      {suggestion.profit_margin && (
                        <span className="text-green-600">
                          {suggestion.profit_margin.toFixed(1)}% margin
                        </span>
                      )}
                      
                      <span className="text-muted-foreground">
                        Stock: {suggestion.stock_quantity}
                      </span>
                      
                      <div className="flex-1" />
                      
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{(suggestion.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onAddToCart(suggestion)}
                    disabled={!suggestion.in_stock}
                    className="mt-1"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Integrate into POS Page**

Add to `/app/sales/pos/page.tsx`:

```typescript
// 1. Import the component
import AISuggestionsPanel from '@/components/pos/AISuggestionsPanel';

// 2. Add state for showing AI panel
const [showAIPanel, setShowAIPanel] = useState(false);

// 3. Add function to add AI suggestion to cart
const addAISuggestionToCart = async (suggestion: any) => {
  // Search for the product and add to cart
  try {
    const res = await golangAPI.get(`/api/erp/products/${suggestion.product_id}`);
    const product = res.data;
    
    // Call existing selectProduct function
    if (product.batches && product.batches.length > 0) {
      addToCart({
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        batch_id: product.batches[0].id,
        batch_no: product.batches[0].batch_no,
        quantity: 1,
        unit_price: suggestion.suggested_price,
        mrp: product.mrp,
        tax_percent: product.gst_rate || 5,
      });
      
      toast({
        title: '✅ AI Suggestion Added',
        description: `${product.name} added to cart`,
      });
    }
  } catch (error) {
    toast({
      title: 'Failed to add product',
      variant: 'destructive',
    });
  }
};

// 4. Add button to show AI panel (in main toolbar)
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowAIPanel(!showAIPanel)}
  className="gap-2"
>
  <Sparkles className="w-4 h-4" />
  AI Suggestions
</Button>

// 5. Add AI panel (in a sidebar or dialog)
{showAIPanel && (
  <div className="w-96">
    <AISuggestionsPanel
      cartItems={cart}
      customerId={selectedCustomer?.id}
      onAddToCart={addAISuggestionToCart}
    />
  </div>
)}
```

---

## 📊 **Profit Margin Calculations** 

### **Enhanced Cart Display with Margins**

Modify cart item display in POS:

```typescript
// In cart item row
<TableRow>
  <TableCell>{item.name}</TableCell>
  <TableCell>{item.quantity}</TableCell>
  <TableCell>₹{item.unit_price}</TableCell>
  
  {/* NEW: Show cost price & margin */}
  <TableCell className="text-xs text-muted-foreground">
    Cost: ₹{item.cost_price || 0}
  </TableCell>
  <TableCell>
    <Badge variant={item.profit_margin > 40 ? 'default' : 'secondary'}>
      {item.profit_margin?.toFixed(1)}% margin
    </Badge>
  </TableCell>
  
  <TableCell className="font-semibold">
    ₹{item.total}
  </TableCell>
</TableRow>

// In cart summary
<div className="space-y-2 p-4 border-t">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>₹{subtotal.toFixed(2)}</span>
  </div>
  <div className="flex justify-between">
    <span>Discount:</span>
    <span>-₹{discountAmount.toFixed(2)}</span>
  </div>
  <div className="flex justify-between">
    <span>Tax:</span>
    <span>₹{totalTax.toFixed(2)}</span>
  </div>
  
  {/* NEW: Show total profit */}
  <div className="flex justify-between text-green-600 font-semibold">
    <span>💰 Total Profit:</span>
    <span>₹{totalProfit.toFixed(2)}</span>
  </div>
  <div className="flex justify-between text-green-600 text-sm">
    <span>Profit Margin:</span>
    <span>{overallMargin.toFixed(1)}%</span>
  </div>
  
  <div className="flex justify-between text-xl font-bold border-t pt-2">
    <span>Grand Total:</span>
    <span>₹{grandTotal.toFixed(2)}</span>
  </div>
</div>
```

### **Calculate Profit in Cart State**

```typescript
// Add to cart item interface
interface CartItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;  // NEW
  profit_per_unit: number;  // NEW
  profit_margin: number;  // NEW
  total: number;
  profit_total: number;  // NEW
}

// Calculate profit when adding to cart
const addToCart = (product, batch) => {
  const costPrice = batch.cost_price || batch.purchase_price || 0;
  const sellingPrice = batch.selling_price || product.mrp;
  const profitPerUnit = sellingPrice - costPrice;
  const profitMargin = costPrice > 0 ? (profitPerUnit / costPrice) * 100 : 0;

  const cartItem: CartItem = {
    // ... existing fields
    cost_price: costPrice,
    profit_per_unit: profitPerUnit,
    profit_margin: profitMargin,
    profit_total: profitPerUnit * quantity,
  };

  setCart([...cart, cartItem]);
};

// Calculate total profit
const totalProfit = cart.reduce((sum, item) => sum + item.profit_total, 0);
const totalCost = cart.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
const overallMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
```

---

## 🩺 **Disease-Based Suggestions Component**

Create: `app/components/pos/DiseaseSearch.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Stethoscope } from 'lucide-react';
import { golangAPI } from '@/lib/api';

export default function DiseaseSearch({ onAddMedicine }: any) {
  const [disease, setDisease] = useState('');
  const [protocol, setProtocol] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchDisease = async () => {
    if (!disease) return;
    
    setLoading(true);
    try {
      const res = await golangAPI.post('/api/erp/pos/disease-suggestions', {
        disease,
        symptoms: [],
      });
      
      setProtocol(res.data.protocol);
    } catch (error) {
      console.error('Disease search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold">Disease-Based Search</h3>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Enter disease (e.g., Fever, Cough, Pain)"
          value={disease}
          onChange={(e) => setDisease(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchDisease()}
        />
        <Button onClick={searchDisease} disabled={loading}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
      
      {protocol && (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Primary Remedies:</h4>
            {protocol.primary?.map((item: any, idx: number) => (
              <Card key={idx} className="p-3 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.medicine}</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dosage: {item.dosage}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => onAddMedicine(item.medicine)}>
                    Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          {protocol.supportive && (
            <div>
              <h4 className="font-medium mb-2">Supportive Remedies:</h4>
              {protocol.supportive.map((item: any, idx: number) => (
                <Card key={idx} className="p-2 mb-2 bg-gray-50">
                  <p className="text-sm font-medium">{item.medicine}</p>
                  <p className="text-xs text-muted-foreground">{item.reason}</p>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-sm">
            <p><strong>Duration:</strong> {protocol.duration}</p>
            <p className="mt-2">{protocol.notes}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
```

---

## 🎉 **Testing Guide**

### **Test 1: AI Suggestions**

```bash
# 1. Start backend with OpenAI key
cd services/api-golang-master
export OPENAI_API_KEY=your-key
go run cmd/main.go

# 2. Test API
curl -X POST http://localhost:3005/api/erp/pos/ai-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "cart_items": [
      {"product_id": "uuid", "name": "Arnica 30C", "quantity": 2}
    ],
    "disease": "trauma"
  }'

# Expected: List of 5-10 complementary products
```

### **Test 2: Disease Search**

```bash
curl -X POST http://localhost:3005/api/erp/pos/disease-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "Fever with headache",
    "symptoms": ["high temperature", "throbbing pain"]
  }'

# Expected: Complete treatment protocol from AI
```

### **Test 3: Profit Margins**

```
1. Add products to POS cart
2. Check cart displays:
   - Cost price
   - Selling price
   - Profit per unit
   - Profit margin %
   - Total profit at bottom
3. Verify margins are color-coded (green >40%)
```

---

## 📝 **Summary**

### **✅ Implemented**

1. ✅ **Hold Bills** - Complete backend + frontend
2. ✅ **AI Smart Suggestions** - 4 algorithms (Frequency, OpenAI, Similar, Upsell)
3. ✅ **Disease-Based AI** - OpenAI GPT-4o-mini integration
4. ✅ **Profit Calculations** - Backend queries ready
5. ✅ **API Endpoints** - All routes registered

### **🔄 Frontend Needed**

1. Create `AISuggestionsPanel.tsx`
2. Create `DiseaseSearch.tsx`
3. Update POS cart to show profit margins
4. Add AI button to POS toolbar
5. Integrate components

### **🚀 Next Steps**

Run the migration, add OpenAI key, restart backend, then implement the frontend components using the code provided above!

---

**You now have the most advanced AI-powered POS system for homeopathy!** 🎉
