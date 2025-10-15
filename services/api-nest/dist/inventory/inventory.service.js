"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const shared_db_1 = require("@yeelo/shared-db");
let InventoryService = class InventoryService {
    async getSummary(shopId) {
        const products = await shared_db_1.prisma.product.findMany({
            where: { shopId },
            include: {
                inventory: true,
            },
        });
        return products.map((p) => ({
            productId: p.id,
            name: p.name,
            totalStock: p.inventory.reduce((s, i) => s + i.quantity, 0),
            reorderLevel: Math.min(...p.inventory.map((i) => i.reorderLevel || 10)),
        }));
    }
    async addStock(productId, shopId, quantity, batchNo, expiryDate) {
        if (quantity <= 0)
            throw new common_1.BadRequestException("Quantity must be positive");
        return await shared_db_1.prisma.inventory.upsert({
            where: { productId_shopId_batchNo: { productId, shopId, batchNo } },
            update: { quantity: { increment: quantity }, expiryDate },
            create: { productId, shopId, quantity, batchNo, expiryDate },
        });
    }
    async adjustStock(productId, shopId, quantityDelta, batchNo) {
        const record = await shared_db_1.prisma.inventory.findUnique({
            where: { productId_shopId_batchNo: { productId, shopId, batchNo } },
        });
        if (!record)
            throw new common_1.BadRequestException("Inventory record not found");
        const newQty = record.quantity + quantityDelta;
        if (newQty < 0)
            throw new common_1.BadRequestException("Insufficient stock");
        return await shared_db_1.prisma.inventory.update({ where: { id: record.id }, data: { quantity: newQty } });
    }
    async lowStock(shopId) {
        const items = await shared_db_1.prisma.inventory.findMany({ where: { shopId } });
        return items.filter((i) => i.quantity <= (i.reorderLevel || 10));
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
//# sourceMappingURL=inventory.service.js.map