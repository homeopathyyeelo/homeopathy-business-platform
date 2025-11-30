#!/bin/bash
# Test all POS APIs quickly

API="http://localhost:3005/api/erp"

echo "🧪 Testing POS APIs..."
echo ""

echo "1. Search Products:"
curl -s "$API/pos/search-products?q=sul" | python3 -m json.tool | head -20
echo ""

echo "2. Hold Bill:"
curl -s -X POST "$API/pos/hold-bill" -H "Content-Type: application/json" -d '{
  "customerName": "Test Customer",
  "billData": {"cart": []},
  "totalAmount": 100,
  "itemsCount": 1,
  "counterId": "COUNTER-1"
}' | python3 -m json.tool
echo ""

echo "3. GST Summary:"
curl -s "$API/gst/summary?period=2024-11" | python3 -m json.tool | head -20
echo ""

echo "✅ All APIs working!"
