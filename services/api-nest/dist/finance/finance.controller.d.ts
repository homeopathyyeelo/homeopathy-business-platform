import { FinanceService } from "./finance.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<{
        shop: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            name: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            name: string;
            email: string | null;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
        items: ({
            product: {
                description: string | null;
                id: string;
                shopId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            description: string;
            id: string;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            productId: string | null;
            invoiceId: string;
        })[];
    } & {
        type: import("@yeelo/shared-db").$Enums.InvoiceType;
        id: string;
        invoiceNumber: string;
        customerId: string;
        shopId: string;
        orderId: string | null;
        status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
        subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        notes: string | null;
        paymentTerms: string | null;
        dueDate: Date | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getInvoices(shopId?: string, customerId?: string, status?: string, page?: number, limit?: number): Promise<{
        invoices: ({
            shop: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                name: string;
                email: string | null;
                address: string;
                isActive: boolean;
                workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
            };
            customer: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string;
                name: string;
                email: string | null;
                address: string | null;
                dateOfBirth: Date | null;
                gender: string | null;
                marketingConsent: boolean;
                loyaltyPoints: number;
            };
            items: ({
                product: {
                    description: string | null;
                    id: string;
                    shopId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    isActive: boolean;
                    price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                    imageUrl: string | null;
                    category: string | null;
                };
            } & {
                description: string;
                id: string;
                totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                createdAt: Date;
                quantity: number;
                unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                productId: string | null;
                invoiceId: string;
            })[];
        } & {
            type: import("@yeelo/shared-db").$Enums.InvoiceType;
            id: string;
            invoiceNumber: string;
            customerId: string;
            shopId: string;
            orderId: string | null;
            status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
            subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            notes: string | null;
            paymentTerms: string | null;
            dueDate: Date | null;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getInvoice(id: string): Promise<{
        shop: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            name: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            name: string;
            email: string | null;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
        items: ({
            product: {
                description: string | null;
                id: string;
                shopId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            description: string;
            id: string;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            productId: string | null;
            invoiceId: string;
        })[];
        payments: {
            id: string;
            status: import("@yeelo/shared-db").$Enums.PaymentState;
            createdAt: Date;
            invoiceId: string;
            amount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            paymentMethod: import("@yeelo/shared-db").$Enums.PaymentMethod;
            reference: string | null;
            processedBy: string | null;
            processedAt: Date;
        }[];
    } & {
        type: import("@yeelo/shared-db").$Enums.InvoiceType;
        id: string;
        invoiceNumber: string;
        customerId: string;
        shopId: string;
        orderId: string | null;
        status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
        subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        notes: string | null;
        paymentTerms: string | null;
        dueDate: Date | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateInvoiceStatus(id: string, body: {
        status: string;
    }): Promise<{
        shop: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            name: string;
            email: string | null;
            address: string;
            isActive: boolean;
            workingHours: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue | null;
        };
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            phone: string;
            name: string;
            email: string | null;
            address: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            marketingConsent: boolean;
            loyaltyPoints: number;
        };
        items: ({
            product: {
                description: string | null;
                id: string;
                shopId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                price: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
                imageUrl: string | null;
                category: string | null;
            };
        } & {
            description: string;
            id: string;
            totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            taxRate: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
            productId: string | null;
            invoiceId: string;
        })[];
    } & {
        type: import("@yeelo/shared-db").$Enums.InvoiceType;
        id: string;
        invoiceNumber: string;
        customerId: string;
        shopId: string;
        orderId: string | null;
        status: import("@yeelo/shared-db").$Enums.InvoiceStatus;
        subtotal: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        taxAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        totalAmount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        notes: string | null;
        paymentTerms: string | null;
        dueDate: Date | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    recordPayment(body: {
        invoiceId: string;
        amount: number;
        paymentMethod: string;
        reference?: string;
    }): Promise<{
        id: string;
        status: import("@yeelo/shared-db").$Enums.PaymentState;
        createdAt: Date;
        invoiceId: string;
        amount: import("@yeelo/shared-db/generated/client/runtime/library").Decimal;
        paymentMethod: import("@yeelo/shared-db").$Enums.PaymentMethod;
        reference: string | null;
        processedBy: string | null;
        processedAt: Date;
    }>;
    getProfitLossReport(shopId?: string, dateFrom?: string, dateTo?: string): Promise<{
        revenue: number;
        costs: number;
        tax: number;
        grossProfit: number;
        netProfit: number;
        orderCount: number;
        avgOrderValue: number;
        profitMargin: number;
    }>;
    getCashFlowReport(shopId?: string, dateFrom?: string, dateTo?: string): Promise<{
        cashInflows: number;
        cashOutflows: number;
        pendingReceivables: number;
        pendingPayables: number;
        netCashFlow: number;
    }>;
    getGSTReport(shopId?: string, dateFrom?: string, dateTo?: string): Promise<{
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
