import { Injectable, BadRequestException } from "@nestjs/common"
import { prisma } from "@yeelo/shared-db"

@Injectable()
export class InventoryService {
  async getSummary(shopId: string) {
    const products = await prisma.product.findMany({
      where: { shopId },
      include: {
        inventory: true,
      },
    })
    return products.map((p) => ({
      productId: p.id,
      name: p.name,
      totalStock: p.inventory.reduce((s, i) => s + i.quantity, 0),
      reorderLevel: Math.min(...p.inventory.map((i) => i.reorderLevel || 10)),
    }))
  }

  async addStock(productId: string, shopId: string, quantity: number, batchNo?: string, expiryDate?: Date) {
    if (quantity <= 0) throw new BadRequestException("Quantity must be positive")
    return await prisma.inventory.upsert({
      where: { productId_shopId_batchNo: { productId, shopId, batchNo } },
      update: { quantity: { increment: quantity }, expiryDate },
      create: { productId, shopId, quantity, batchNo, expiryDate },
    })
  }

  async adjustStock(productId: string, shopId: string, quantityDelta: number, batchNo?: string) {
    const record = await prisma.inventory.findUnique({
      where: { productId_shopId_batchNo: { productId, shopId, batchNo } },
    })
    if (!record) throw new BadRequestException("Inventory record not found")
    const newQty = record.quantity + quantityDelta
    if (newQty < 0) throw new BadRequestException("Insufficient stock")
    return await prisma.inventory.update({ where: { id: record.id }, data: { quantity: newQty } })
  }

  async lowStock(shopId: string) {
    const items = await prisma.inventory.findMany({ where: { shopId } })
    return items.filter((i) => i.quantity <= (i.reorderLevel || 10))
  }
}
