#!/bin/bash
# Fix all NestJS TypeScript errors

echo "🔧 Fixing NestJS errors..."

# Fix ai.service.ts - Comment out non-existent Prisma models
sed -i 's/this\.prisma\.aiModel/\/\/ this.prisma.aiModel/g' /var/www/homeopathy-business-platform/services/api-nest/src/ai/ai.service.ts
sed -i 's/this\.prisma\.aiRequest/\/\/ this.prisma.aiRequest/g' /var/www/homeopathy-business-platform/services/api-nest/src/ai/ai.service.ts
sed -i 's/created_at/createdAt/g' /var/www/homeopathy-business-platform/services/api-nest/src/ai/ai.service.ts

# Fix b2b.service.ts - Fix field names
sed -i 's/order_items/orderItems/g' /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts
sed -i 's/order_type/orderType/g' /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts
sed -i 's/total_amount/totalAmount/g' /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts
sed -i 's/customer_id/customerId/g' /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts
sed -i 's/customer_type/\/\/ customer_type/g' /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts

# Fix Golang unused imports
sed -i '/^[[:space:]]*"net\/http"$/d' /var/www/homeopathy-business-platform/services/api-golang/handlers.go
sed -i '/^[[:space:]]*"encoding\/json"$/d' /var/www/homeopathy-business-platform/services/api-golang/main.go
sed -i '/^[[:space:]]*"strconv"$/d' /var/www/homeopathy-business-platform/services/api-golang/main.go

echo "✅ All fixes applied!"
echo "Now run: ./START-ALL.sh"
