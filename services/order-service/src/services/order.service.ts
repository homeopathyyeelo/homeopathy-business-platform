import { PrismaClient, Order, OrderItem, OrderStatus, OrderType, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface OrderWithRelations extends Order {
  customer?: any;
  shop?: any;
  user?: any;
  orderItems?: OrderItem[];
}

export class OrderService {
  async createOrder(orderData: {
    customerId: string;
    shopId: string;
    userId?: string;
    orderType?: OrderType;
    notes?: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<OrderWithRelations> {
    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: orderData.customerId,
        shopId: orderData.shopId,
        userId: orderData.userId,
        totalAmount,
        status: OrderStatus.PENDING,
        orderType: orderData.orderType || OrderType.WALK_IN,
        paymentStatus: PaymentStatus.PENDING,
        notes: orderData.notes,
        orderItems: {
          create: orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        customer: true,
        shop: true,
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return order;
  }

  async getOrderById(id: string): Promise<OrderWithRelations | null> {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        shop: true,
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getOrders(options: {
    shopId?: string;
    customerId?: string;
    status?: OrderStatus;
    orderType?: OrderType;
    page?: number;
    limit?: number;
  } = {}): Promise<{ orders: OrderWithRelations[]; total: number }> {
    const { shopId, customerId, status, orderType, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (shopId) where.shopId = shopId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          shop: true,
          user: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return await prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    return await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });
  }

  async getOrdersByCustomer(customerId: string): Promise<OrderWithRelations[]> {
    return await prisma.order.findMany({
      where: { customerId },
      include: {
        shop: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrdersByShop(shopId: string): Promise<OrderWithRelations[]> {
    return await prisma.order.findMany({
      where: { shopId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingOrders(shopId?: string): Promise<OrderWithRelations[]> {
    const where: any = { status: OrderStatus.PENDING };
    if (shopId) where.shopId = shopId;

    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        shop: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCompletedOrders(shopId?: string, startDate?: Date, endDate?: Date): Promise<OrderWithRelations[]> {
    const where: any = {
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
    };

    if (shopId) where.shopId = shopId;
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderSummary(shopId: string, startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const where: any = { shopId };
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [totalOrders, totalRevenue, pendingOrders, completedOrders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: { ...where, status: OrderStatus.PENDING },
      }),
      prisma.order.count({
        where: { ...where, status: OrderStatus.DELIVERED },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders,
      completedOrders,
    };
  }
}
