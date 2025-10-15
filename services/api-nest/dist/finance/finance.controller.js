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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const auth_guard_1 = require("../guards/auth.guard");
let FinanceController = class FinanceController {
    constructor(financeService) {
        this.financeService = financeService;
    }
    async createInvoice(createInvoiceDto) {
        return this.financeService.createInvoice(createInvoiceDto);
    }
    async getInvoices(shopId, customerId, status, page, limit) {
        return this.financeService.getInvoices(shopId, customerId, status, page, limit);
    }
    async getInvoice(id) {
        return this.financeService.getInvoice(id);
    }
    async updateInvoiceStatus(id, body) {
        return this.financeService.updateInvoiceStatus(id, body.status);
    }
    async recordPayment(body) {
        return this.financeService.recordPayment(body.invoiceId, body.amount, body.paymentMethod, body.reference);
    }
    async getProfitLossReport(shopId, dateFrom, dateTo) {
        return this.financeService.getProfitLossReport(shopId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
    async getCashFlowReport(shopId, dateFrom, dateTo) {
        return this.financeService.getCashFlowReport(shopId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
    async getGSTReport(shopId, dateFrom, dateTo) {
        return this.financeService.getGSTReport(shopId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
    async getCurrencyRates() {
        return this.financeService.getCurrencyRates();
    }
    async convertCurrency(amount, fromCurrency, toCurrency) {
        return this.financeService.convertCurrency(amount, fromCurrency, toCurrency);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Post)("invoices"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)("invoices"),
    __param(0, (0, common_1.Query)("shopId")),
    __param(1, (0, common_1.Query)("customerId")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Query)("page")),
    __param(4, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Get)("invoices/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Put)("invoices/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "updateInvoiceStatus", null);
__decorate([
    (0, common_1.Post)("payments"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "recordPayment", null);
__decorate([
    (0, common_1.Get)("reports/profit-loss"),
    __param(0, (0, common_1.Query)("shopId")),
    __param(1, (0, common_1.Query)("dateFrom")),
    __param(2, (0, common_1.Query)("dateTo")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getProfitLossReport", null);
__decorate([
    (0, common_1.Get)("reports/cash-flow"),
    __param(0, (0, common_1.Query)("shopId")),
    __param(1, (0, common_1.Query)("dateFrom")),
    __param(2, (0, common_1.Query)("dateTo")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCashFlowReport", null);
__decorate([
    (0, common_1.Get)("reports/gst"),
    __param(0, (0, common_1.Query)("shopId")),
    __param(1, (0, common_1.Query)("dateFrom")),
    __param(2, (0, common_1.Query)("dateTo")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getGSTReport", null);
__decorate([
    (0, common_1.Get)("currency/rates"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCurrencyRates", null);
__decorate([
    (0, common_1.Get)("currency/convert"),
    __param(0, (0, common_1.Query)("amount")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "convertCurrency", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)("finance"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map