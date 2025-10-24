#!/bin/bash

echo "Testing All Fixed Endpoints"
echo "============================"
echo ""

# Test Go v2 Health
echo "1. Testing Go v2 Health:"
curl -s http://localhost:3005/health | jq . || echo "FAILED or service not running"
echo ""

# Test Dashboard Stats
echo "2. Testing Dashboard Stats:"
curl -s http://localhost:3005/api/erp/dashboard/stats | jq . || echo "FAILED"
echo ""

# Test Dashboard Activity
echo "3. Testing Dashboard Activity:"
curl -s http://localhost:3005/api/erp/dashboard/activity | jq . || echo "FAILED"
echo ""

# Test Inventory
echo "4. Testing Inventory Stock:"
curl -s http://localhost:3005/api/erp/inventory | jq . || echo "FAILED"
echo ""

# Test Adjustments
echo "5. Testing Inventory Adjustments:"
curl -s http://localhost:3005/api/erp/inventory/adjustments | jq . || echo "FAILED"
echo ""

# Test Transfers
echo "6. Testing Inventory Transfers:"
curl -s http://localhost:3005/api/erp/inventory/transfers | jq . || echo "FAILED"
echo ""

# Test System Health
echo "7. Testing System Health:"
curl -s http://localhost:3005/api/v1/system/health | jq . || echo "FAILED"
echo ""

# Test Bug Tracking
echo "8. Testing Bug Tracking:"
curl -s http://localhost:3005/api/v1/system/bugs | jq . || echo "FAILED"
echo ""

# Test Expiry
echo "9. Testing Expiry Dashboard:"
curl -s http://localhost:3005/api/v2/inventory/expiries | jq . || echo "FAILED"
echo ""

echo "============================"
echo "Test Complete"
echo ""
echo "Frontend URLs to test in browser:"
echo "  http://localhost:3000/products/edit/1"
echo "  http://localhost:3000/inventory/stock"
echo "  http://localhost:3000/inventory/adjustments"
echo "  http://localhost:3000/inventory/transfers"
echo "  http://localhost:3000/dashboard/stats"
echo "  http://localhost:3000/dashboard/activity"
echo "  http://localhost:3000/system/bugs"
echo "  http://localhost:3000/products/import-export"
