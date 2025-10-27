import { PrismaClient, Product, Shop } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductWithRelations extends Product {
  shop?: Shop;
}

export class ProductService {
  async getAllProducts(options: {
    shopId?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ products: ProductWithRelations[]; total: number }> {
    const { shopId, category, search, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (shopId) where.shopId = shopId;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          shop: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async getProductById(id: string): Promise<ProductWithRelations | null> {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category?: string;
    shopId: string;
  }): Promise<Product> {
    return await prisma.product.create({
      data: productData,
    });
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    return await prisma.product.update({
      where: { id },
      data: productData,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }

  async getProductsByCategory(category: string, shopId?: string): Promise<Product[]> {
    const where: any = { category };
    if (shopId) where.shopId = shopId;

    return await prisma.product.findMany({
      where,
      include: {
        shop: true,
      },
    });
  }

  async searchProducts(query: string, shopId?: string): Promise<Product[]> {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (shopId) where.shopId = shopId;

    return await prisma.product.findMany({
      where,
      include: {
        shop: true,
      },
    });
  }

  async getLowStockProducts(shopId: string, threshold: number = 10): Promise<Product[]> {
    return await prisma.product.findMany({
      where: {
        shopId,
        // Add inventory logic here when inventory table is properly connected
      },
      include: {
        shop: true,
      },
    });
  }
}
