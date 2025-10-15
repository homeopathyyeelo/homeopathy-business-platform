#!/bin/bash
# Temporarily disable broken NestJS AI and B2B services

echo "🔧 Disabling broken NestJS services..."

# Rename broken files
mv /var/www/homeopathy-business-platform/services/api-nest/src/ai/ai.service.ts /var/www/homeopathy-business-platform/services/api-nest/src/ai/ai.service.ts.bak 2>/dev/null || true
mv /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts.bak 2>/dev/null || true

# Create stub services
cat > /var/www/homeopathy-business-platform/services/api-nest/src/ai/ai.service.ts << 'EOF'
import { Injectable } from "@nestjs/common"

@Injectable()
export class AIService {
  async generateContent() {
    return { message: "AI service temporarily disabled" }
  }
}
EOF

cat > /var/www/homeopathy-business-platform/services/api-nest/src/b2b/b2b.service.ts << 'EOF'
import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class B2BService {
  constructor(private prisma: PrismaService) {}

  async getB2BOrders() {
    return { orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
  }
}
EOF

echo "✅ Broken services disabled. NestJS should compile now."
echo "Run: ./START-ALL.sh"
