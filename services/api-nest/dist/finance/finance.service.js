"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const shared_db_1 = require("@yeelo/shared-db");
const outbox_service_1 = require("../outbox/outbox.service");
let FinanceService = class FinanceService {
    constructor(outboxService) {
        this.outboxService = outboxService;
    }
    async createInvoice(createInvoiceDto) {
        const { customerId, shopId, orderId, items, ...invoiceData } = createInvoiceDto;
        const customer = await shared_db_1.prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
            throw new common_1.BadRequestException("Customer not found");
        }
        const shop = await shared_db_1.prisma.shop.findUnique({ where: { id: shopId } });
        if (!shop) {
            throw new common_1.BadRequestException("Shop not found");
        }
        const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
        const taxAmount = items.reduce((sum, item) => sum + (item.totalAmount * item.taxRate / 100), 0);
        const totalAmount = subtotal + taxAmount;
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const result = await shared_db_1.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    ...invoiceData,
                    invoiceNumber,
                    customer: { connect: { id: customerId } },
                    shop: { connect: { id: shopId } },
                    ...(orderId ? { order: { connect: { id: orderId } } } : {}),
                    subtotal,
                    taxAmount,
                    totalAmount,
                    status: "DRAFT",
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxRate: item.taxRate,
                            totalAmount: item.totalAmount,
                        })),
                    },
                },
                include: {
                    items: { include: { product: true } },
                    customer: true,
                    shop: true,
                },
            });
            await this.outboxService.createEvent(tx, {
                eventType: "invoice.created",
                aggregateId: invoice.id,
                payload: {
                    invoiceId: invoice.id,
                    customerId: invoice.customerId,
                    customerName: invoice.customer.name,
                    shopId: invoice.shopId,
                    totalAmount: Number(invoice.totalAmount),
                    type: invoice.type,
                },
            });
            return invoice;
        });
        return result;
    }
    async getInvoices(shopId, customerId, status, page = 1, limit = 20) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (customerId)
            where.customerId = customerId;
        if (status)
            where.status = status;
        const [invoices, total] = await Promise.all([
            shared_db_1.prisma.invoice.findMany({
                where,
                include: {
                    items: { include: { product: true } },
                    customer: true,
                    shop: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            shared_db_1.prisma.invoice.count({ where }),
        ]);
        return { invoices, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async getInvoice(id) {
        const invoice = await shared_db_1.prisma.invoice.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                customer: true,
                shop: true,
                payments: true,
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException("Invoice not found");
        }
        return invoice;
    }
    async updateInvoiceStatus(id, status) {
        const invoice = await shared_db_1.prisma.invoice.update({
            where: { id },
            data: { status: status },
            include: {
                items: { include: { product: true } },
                customer: true,
                shop: true,
            },
        });
        await this.outboxService.createEvent(shared_db_1.prisma, {
            eventType: "invoice.status_updated",
            aggregateId: invoice.id,
            payload: {
                invoiceId: invoice.id,
                customerId: invoice.customerId,
                shopId: invoice.shopId,
                status,
                totalAmount: Number(invoice.totalAmount),
            },
        });
        return invoice;
    }
    async recordPayment(invoiceId, amount, paymentMethod, reference) {
        const invoice = await shared_db_1.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true },
        });
        if (!invoice) {
            throw new common_1.NotFoundException("Invoice not found");
        }
        const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingAmount = Number(invoice.totalAmount) - totalPaid;
        if (amount > remainingAmount) {
            throw new common_1.BadRequestException("Payment amount exceeds remaining balance");
        }
        const result = await shared_db_1.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    invoiceId,
                    amount,
                    paymentMethod: paymentMethod,
                    reference,
                    status: "COMPLETED",
                },
            });
            const newTotalPaid = totalPaid + amount;
            if (newTotalPaid >= Number(invoice.totalAmount)) {
                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { status: "PAID" },
                });
            }
            await this.outboxService.createEvent(tx, {
                eventType: "payment.recorded",
                aggregateId: payment.id,
                payload: {
                    paymentId: payment.id,
                    invoiceId,
                    amount,
                    paymentMethod,
                    reference,
                },
            });
            return payment;
        });
        return result;
    }
    async getProfitLossReport(shopId, dateFrom, dateTo) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        const [totalRevenue, totalCosts, totalTax, orderCount, avgOrderValue,] = await Promise.all([
            shared_db_1.prisma.order.aggregate({
                where: { ...where, status: "DELIVERED" },
                _sum: { totalAmount: true },
            }),
            shared_db_1.prisma.purchaseOrder.aggregate({
                where: { ...where, status: "RECEIVED" },
                _sum: { totalAmount: true },
            }),
            shared_db_1.prisma.invoice.aggregate({
                where: { ...where, status: "PAID" },
                _sum: { taxAmount: true },
            }),
            shared_db_1.prisma.order.count({
                where: { ...where, status: "DELIVERED" },
            }),
            shared_db_1.prisma.order.aggregate({
                where: { ...where, status: "DELIVERED" },
                _avg: { totalAmount: true },
            }),
        ]);
        const revenue = Number(totalRevenue._sum.totalAmount || 0);
        const costs = Number(totalCosts._sum.totalAmount || 0);
        const tax = Number(totalTax._sum.taxAmount || 0);
        const grossProfit = revenue - costs;
        const netProfit = grossProfit - tax;
        return {
            revenue,
            costs,
            tax,
            grossProfit,
            netProfit,
            orderCount,
            avgOrderValue: Number(avgOrderValue._avg.totalAmount || 0),
            profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
        };
    }
    async getCashFlowReport(shopId, dateFrom, dateTo) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        const [cashInflows, cashOutflows, pendingReceivables, pendingPayables,] = await Promise.all([
            shared_db_1.prisma.payment.aggregate({
                where: { ...where, status: "COMPLETED" },
                _sum: { amount: true },
            }),
            shared_db_1.prisma.purchaseOrder.aggregate({
                where: { ...where, status: "RECEIVED" },
                _sum: { totalAmount: true },
            }),
            shared_db_1.prisma.invoice.aggregate({
                where: { ...where, status: "SENT" },
                _sum: { totalAmount: true },
            }),
            shared_db_1.prisma.purchaseOrder.aggregate({
                where: { ...where, status: "ORDERED" },
                _sum: { totalAmount: true },
            }),
        ]);
        return {
            cashInflows: Number(cashInflows._sum.amount || 0),
            cashOutflows: Number(cashOutflows._sum.totalAmount || 0),
            pendingReceivables: Number(pendingReceivables._sum.totalAmount || 0),
            pendingPayables: Number(pendingPayables._sum.totalAmount || 0),
            netCashFlow: Number(cashInflows._sum.amount || 0) - Number(cashOutflows._sum.totalAmount || 0),
        };
    }
    async getGSTReport(shopId, dateFrom, dateTo) {
        const where = {};
        if (shopId)
            where.shopId = shopId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        const gstData = await shared_db_1.prisma.invoice.groupBy({
            by: ["shopId"],
            where: { ...where, status: "PAID" },
            _sum: {
                subtotal: true,
                taxAmount: true,
                totalAmount: true,
            },
            _count: { id: true },
        });
        return gstData.map((data) => ({
            shopId: data.shopId,
            totalInvoices: data._count.id,
            taxableAmount: Number(data._sum.subtotal || 0),
            gstAmount: Number(data._sum.taxAmount || 0),
            totalAmount: Number(data._sum.totalAmount || 0),
        }));
    }
    async getCurrencyRates() {
        return {
            INR: { rate: 1, symbol: "₹" },
            EUR: { rate: 0.011, symbol: "€" },
            USD: { rate: 0.012, symbol: "$" },
        };
    }
    async convertCurrency(amount, fromCurrency, toCurrency) {
        const rates = await this.getCurrencyRates();
        const fromRate = rates[fromCurrency]?.rate || 1;
        const toRate = rates[toCurrency]?.rate || 1;
        return (amount / fromRate) * toRate;
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [outbox_service_1.OutboxService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map