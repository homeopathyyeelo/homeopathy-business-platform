import { PrismaService } from "../prisma/prisma.service";
export declare class B2BService {
    private prisma;
    constructor(prisma: PrismaService);
    createB2BOrder(orderData: any): Promise<any>;
    getB2BOrders(customerId?: string, status?: string, page?: number, limit?: number): Promise<{
        orders: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getB2BOrder(id: string): Promise<{
        id: string;
        status: string;
        items: any[];
        customer: any;
    }>;
    approveB2BOrder(id: string, userId: string): Promise<{
        id: string;
        status: string;
        approvedBy: string;
        approvedAt: Date;
    }>;
    rejectB2BOrder(id: string, reason: string, userId: string): Promise<{
        id: string;
        status: string;
        rejectionReason: string;
        rejectedBy: string;
        rejectedAt: Date;
    }>;
    getB2BCustomers(type?: string, page?: number, limit?: number): Promise<{
        customers: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getB2BCustomer(id: string): Promise<{
        id: string;
        name: string;
        type: string;
        creditLimit: number;
    }>;
    getCustomerCredit(id: string): Promise<{
        customerId: string;
        creditLimit: number;
        creditUsed: number;
        creditAvailable: number;
        paymentTerms: number;
    }>;
    createD2DTransaction(transactionData: any): Promise<any>;
    getD2DTransactions(sellerId?: string, buyerId?: string, page?: number, limit?: number): Promise<{
        transactions: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getCustomerPricing(customerId: string): Promise<{
        customerId: string;
        priceList: string;
        discountPercentage: number;
        products: any[];
    }>;
    getSalesAnalytics(startDate?: string, endDate?: string, customerType?: string): Promise<{
        totalSales: number;
        totalOrders: number;
        avgOrderValue: number;
        topCustomers: any[];
        salesByType: {
            DEALER: number;
            DISTRIBUTOR: number;
            WHOLESALER: number;
        };
    }>;
}
