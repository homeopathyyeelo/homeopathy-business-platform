import { PrismaClient, Inventory } from '@prisma/client';

const prisma = new PrismaClient();

export interface InventoryWithRelations extends Inventory {
  product?: any;
  shop?: any;
}

export class InventoryService {
  async getInventory(options: {
    shopId?: string;
    productId?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ inventory: InventoryWithRelations[]; total: number }> {
    const { shopId, productId, lowStock, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (shopId) where.shopId = shopId;
    if (productId) where.productId = productId;
    if (lowStock) {
      where.quantity = { lt: where.reorderLevel || 10 };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: true,
          shop: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ]);

    return { inventory, total };
  }

  async getInventoryByProduct(productId: string, shopId: string): Promise<Inventory | null> {
    return await prisma.inventory.findUnique({
      where: {
        productId_shopId: {
          productId,
          shopId,
        },
      },
      include: {
        product: true,
        shop: true,
      },
    });
  }

  async updateInventory(
    productId: string,
    shopId: string,
    updates: {
      quantity?: number;
      batchNo?: string;
      expiryDate?: Date;
      reorderLevel?: number;
    }
  ): Promise<Inventory> {
    return await prisma.inventory.update({
      where: {
        productId_shopId: {
          productId,
          shopId,
        },
      },
      data: updates,
    });
  }

  async addInventory(
    productId: string,
    shopId: string,
    quantity: number,
    batchInfo?: {
      batchNo?: string;
      expiryDate?: Date;
      reorderLevel?: number;
    }
  ): Promise<Inventory> {
    return await prisma.inventory.upsert({
      where: {
        productId_shopId: {
          productId,
          shopId,
        },
      },
      update: {
        quantity: { increment: quantity },
        ...batchInfo,
      },
      create: {
        productId,
        shopId,
        quantity,
        reorderLevel: batchInfo?.reorderLevel || 10,
        batchNo: batchInfo?.batchNo,
        expiryDate: batchInfo?.expiryDate,
      },
    });
  }

  async removeInventory(
    productId: string,
    shopId: string,
    quantity: number
  ): Promise<Inventory> {
    return await prisma.inventory.update({
      where: {
        productId_shopId: {
          productId,
          shopId,
        },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });
  }

  async getLowStockAlerts(shopId: string): Promise<Inventory[]> {
    return await prisma.inventory.findMany({
      where: {
        shopId,
        quantity: { lt: prisma.inventory.fields.reorderLevel },
      },
      include: {
        product: true,
        shop: true,
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async getExpiryAlerts(shopId: string, daysAhead: number = 30): Promise<Inventory[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await prisma.inventory.findMany({
      where: {
        shopId,
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        product: true,
        shop: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getInventoryValue(shopId: string): Promise<number> {
    const result = await prisma.inventory.aggregate({
      where: { shopId },
      _sum: {
        quantity: true,
      },
    });

    // In a real implementation, you'd multiply by unit cost
    return result._sum.quantity || 0;
  }

  async transferInventory(
    productId: string,
    fromShopId: string,
    toShopId: string,
    quantity: number
  ): Promise<{ from: Inventory; to: Inventory }> {
    // Remove from source
    const fromInventory = await this.removeInventory(productId, fromShopId, quantity);

    // Add to destination
    const toInventory = await this.addInventory(productId, toShopId, quantity);

    return { from: fromInventory, to: toInventory };
  }
}
