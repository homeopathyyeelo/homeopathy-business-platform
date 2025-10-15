"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const orders_module_1 = require("./orders/orders.module");
const redis_module_1 = require("./redis/redis.module");
const outbox_module_1 = require("./outbox/outbox.module");
const inventory_module_1 = require("./inventory/inventory.module");
const b2b_module_1 = require("./b2b/b2b.module");
const ai_module_1 = require("./ai/ai.module");
const purchase_module_1 = require("./purchase/purchase.module");
const finance_module_1 = require("./finance/finance.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            health_module_1.HealthModule,
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            outbox_module_1.OutboxModule,
            jwt_1.JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET || "changeme",
                signOptions: { expiresIn: "24h" },
            }),
            orders_module_1.OrdersModule,
            inventory_module_1.InventoryModule,
            b2b_module_1.B2BModule,
            purchase_module_1.PurchaseModule,
            finance_module_1.FinanceModule,
            ai_module_1.AIModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map