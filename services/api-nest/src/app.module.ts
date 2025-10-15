import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { OrdersModule } from "./orders/orders.module"
import { RedisModule } from "./redis/redis.module"
import { OutboxModule } from "./outbox/outbox.module"
import { InventoryModule } from "./inventory/inventory.module"
import { B2BModule } from "./b2b/b2b.module"
import { AIModule } from "./ai/ai.module"
import { PurchaseModule } from "./purchase/purchase.module"
import { FinanceModule } from "./finance/finance.module"
import { PrismaModule } from "./prisma/prisma.module"
import { HealthModule } from "./health/health.module"

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    RedisModule,
    OutboxModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "changeme",
      signOptions: { expiresIn: "24h" },
    }),
    OrdersModule,
    InventoryModule,
    B2BModule,
    PurchaseModule,
    FinanceModule,
    AIModule,
  ],
})
export class AppModule {}
