import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { OutboxService } from "../outbox/outbox.service";
export declare class FinanceService {
    private readonly outboxService;
    constructor(outboxService: OutboxService);
    createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<{
        items: ({
            product: {
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                shopId: string;
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            productId: string | null;
            quantity: number;
            id: string;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            description: string;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            invoiceId: string;
        })[];
        shop: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
    } & {
        type: import("@yeelo/shared-db").$Enums.InvoiceType;
        customerId: string;
        shopId: string;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
        orderId: string | null;
        paymentTerms: string | null;
        createdBy: string | null;
        dueDate: Date | null;
        invoiceNumber: string;
        subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
    }>;
    getInvoices(shopId?: string, customerId?: string, status?: string, page?: number, limit?: number): Promise<{
        invoices: ({
            items: ({
                product: {
                    price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                    shopId: string;
                    id: string;
                    createdAt: Date;
                    name: string;
                    updatedAt: Date;
                    isActive: boolean;
                    description: string | null;
                    imageUrl: string | null;
                    category: string | null;
                };
            } & {
                productId: string | null;
                quantity: number;
                id: string;
                createdAt: Date;
                totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                description: string;
                unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                invoiceId: string;
            })[];
            shop: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                phone: string;
                email: string | null;
                address: string;
                isActive: boolean;
                workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            };
            customer: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                phone: string;
                email: string | null;
                address: string | null;
                dateOfBirth: Date | null;
                gender: string | null;
                marketingConsent: boolean;
                loyaltyPoints: number;
            };
        } & {
            type: import("@yeelo/shared-db").$Enums.InvoiceType;
            customerId: string;
            shopId: string;
            notes: string | null;
            id: string;
            status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            updatedAt: Date;
            orderId: string | null;
            paymentTerms: string | null;
            createdBy: string | null;
            dueDate: Date | null;
            invoiceNumber: string;
            subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getInvoice(id: string): Promise<{
        items: ({
            product: {
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                shopId: string;
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            productId: string | null;
            quantity: number;
            id: string;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            description: string;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            invoiceId: string;
        })[];
        shop: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
        payments: {
            id: string;
            status: import("@yeelo/shared-db").$Enums.PaymentState;
            createdAt: Date;
            processedAt: Date;
            invoiceId: string;
            amount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            paymentMethod: import("@yeelo/shared-db").$Enums.PaymentMethod;
            reference: string | null;
            processedBy: string | null;
        }[];
    } & {
        type: import("@yeelo/shared-db").$Enums.InvoiceType;
        customerId: string;
        shopId: string;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
        orderId: string | null;
        paymentTerms: string | null;
        createdBy: string | null;
        dueDate: Date | null;
        invoiceNumber: string;
        subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
    }>;
    updateInvoiceStatus(id: string, status: string): Promise<{
        items: ({
            product: {
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                shopId: string;
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                isActive: boolean;
                description: string | null;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            productId: string | null;
            quantity: number;
            id: string;
            createdAt: Date;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            description: string;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            invoiceId: string;
        })[];
        shop: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            phone: string;
            email: string | null;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
    } & {
        type: import("@yeelo/shared-db").$Enums.InvoiceType;
        customerId: string;
        shopId: string;
        notes: string | null;
        id: string;
        status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
        createdAt: Date;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        updatedAt: Date;
        orderId: string | null;
        paymentTerms: string | null;
        createdBy: string | null;
        dueDate: Date | null;
        invoiceNumber: string;
        subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
    }>;
    recordPayment(invoiceId: string, amount: number, paymentMethod: string, reference?: string): Promise<{
        id: string;
        status: import("@yeelo/shared-db").$Enums.PaymentState;
        createdAt: Date;
        processedAt: Date;
        invoiceId: string;
        amount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        paymentMethod: import("@yeelo/shared-db").$Enums.PaymentMethod;
        reference: string | null;
        processedBy: string | null;
    }>;
    getProfitLossReport(shopId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
        revenue: number;
        costs: number;
        tax: number;
        grossProfit: number;
        netProfit: number;
        orderCount: number;
        avgOrderValue: number;
        profitMargin: number;
    }>;
    getCashFlowReport(shopId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
        cashInflows: number;
        cashOutflows: number;
        pendingReceivables: number;
        pendingPayables: number;
        netCashFlow: number;
    }>;
    getGSTReport(shopId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
        shopId: string;
        totalInvoices: number;
        taxableAmount: number;
        gstAmount: number;
        totalAmount: number;
    }[]>;
    getCurrencyRates(): Promise<{
        INR: {
            rate: number;
            symbol: string;
        };
        EUR: {
            rate: number;
            symbol: string;
        };
        USD: {
            rate: number;
            symbol: string;
        };
    }>;
    convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
}
