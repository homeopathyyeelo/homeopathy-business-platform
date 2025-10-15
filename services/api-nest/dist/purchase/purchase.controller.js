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
exports.PurchaseController = void 0;
const common_1 = require("@nestjs/common");
const purchase_service_1 = require("./purchase.service");
const create_purchase_order_dto_1 = require("./dto/create-purchase-order.dto");
const create_vendor_dto_1 = require("./dto/create-vendor.dto");
const auth_guard_1 = require("../guards/auth.guard");
let PurchaseController = class PurchaseController {
    constructor(purchaseService) {
        this.purchaseService = purchaseService;
    }
    async createVendor(createVendorDto) {
        return this.purchaseService.createVendor(createVendorDto);
    }
    async getVendors(page, limit) {
        return this.purchaseService.getVendors(page, limit);
    }
    async getVendor(id) {
        return this.purchaseService.getVendor(id);
    }
    async updateVendor(id, updateData) {
        return this.purchaseService.updateVendor(id, updateData);
    }
    async createPurchaseOrder(createPurchaseOrderDto) {
        return this.purchaseService.createPurchaseOrder(createPurchaseOrderDto);
    }
    async getPurchaseOrders(shopId, vendorId, status, page, limit) {
        return this.purchaseService.getPurchaseOrders(shopId, vendorId, status, page, limit);
    }
    async getPurchaseOrder(id) {
        return this.purchaseService.getPurchaseOrder(id);
    }
    async updatePurchaseOrderStatus(id, body) {
        return this.purchaseService.updatePurchaseOrderStatus(id, body.status);
    }
    async createGRN(body) {
        return this.purchaseService.createGRN(body.purchaseOrderId, body.receivedItems);
    }
    async getPurchaseAnalytics(shopId, dateFrom, dateTo) {
        return this.purchaseService.getPurchaseAnalytics(shopId, dateFrom ? new Date(dateFrom) : undefined, dateTo ? new Date(dateTo) : undefined);
    }
};
exports.PurchaseController = PurchaseController;
__decorate([
    (0, common_1.Post)("vendors"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vendor_dto_1.CreateVendorDto]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "createVendor", null);
__decorate([
    (0, common_1.Get)("vendors"),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getVendors", null);
__decorate([
    (0, common_1.Get)("vendors/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getVendor", null);
__decorate([
    (0, common_1.Put)("vendors/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "updateVendor", null);
__decorate([
    (0, common_1.Post)("orders"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_order_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Get)("orders"),
    __param(0, (0, common_1.Query)("shopId")),
    __param(1, (0, common_1.Query)("vendorId")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Query)("page")),
    __param(4, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getPurchaseOrders", null);
__decorate([
    (0, common_1.Get)("orders/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getPurchaseOrder", null);
__decorate([
    (0, common_1.Put)("orders/:id/status"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "updatePurchaseOrderStatus", null);
__decorate([
    (0, common_1.Post)("grn"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "createGRN", null);
__decorate([
    (0, common_1.Get)("analytics"),
    __param(0, (0, common_1.Query)("shopId")),
    __param(1, (0, common_1.Query)("dateFrom")),
    __param(2, (0, common_1.Query)("dateTo")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "getPurchaseAnalytics", null);
exports.PurchaseController = PurchaseController = __decorate([
    (0, common_1.Controller)("purchase"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [purchase_service_1.PurchaseService])
], PurchaseController);
//# sourceMappingURL=purchase.controller.js.map