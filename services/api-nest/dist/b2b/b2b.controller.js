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
exports.B2BController = void 0;
const common_1 = require("@nestjs/common");
const b2b_service_1 = require("./b2b.service");
const auth_guard_1 = require("../guards/auth.guard");
const swagger_1 = require("@nestjs/swagger");
let B2BController = class B2BController {
    constructor(b2bService) {
        this.b2bService = b2bService;
    }
    async createB2BOrder(orderData, req) {
        orderData.created_by = req.user?.id;
        return this.b2bService.createB2BOrder(orderData);
    }
    async getB2BOrders(customerId, status, page, limit) {
        return this.b2bService.getB2BOrders(customerId, status, page ? Number.parseInt(page) : 1, limit ? Number.parseInt(limit) : 20);
    }
    async getB2BOrder(id) {
        return this.b2bService.getB2BOrder(id);
    }
    async approveB2BOrder(id, req) {
        return this.b2bService.approveB2BOrder(id, req.user?.id);
    }
    async rejectB2BOrder(id, reason, req) {
        return this.b2bService.rejectB2BOrder(id, reason, req.user?.id);
    }
    async getB2BCustomers(type, page, limit) {
        return this.b2bService.getB2BCustomers(type, page ? Number.parseInt(page) : 1, limit ? Number.parseInt(limit) : 20);
    }
    async getB2BCustomer(id) {
        return this.b2bService.getB2BCustomer(id);
    }
    async getCustomerCredit(id) {
        return this.b2bService.getCustomerCredit(id);
    }
    async createD2DTransaction(transactionData, req) {
        transactionData.created_by = req.user?.id;
        return this.b2bService.createD2DTransaction(transactionData);
    }
    async getD2DTransactions(sellerId, buyerId, page, limit) {
        return this.b2bService.getD2DTransactions(sellerId, buyerId, page ? Number.parseInt(page) : 1, limit ? Number.parseInt(limit) : 20);
    }
    async getCustomerPricing(customerId) {
        return this.b2bService.getCustomerPricing(customerId);
    }
    async getSalesAnalytics(startDate, endDate, customerType) {
        return this.b2bService.getSalesAnalytics(startDate, endDate, customerType);
    }
};
exports.B2BController = B2BController;
__decorate([
    (0, common_1.Post)("orders"),
    (0, swagger_1.ApiOperation)({ summary: "Create a B2B order" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "B2B order created successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Bad request" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "createB2BOrder", null);
__decorate([
    (0, common_1.Get)("orders"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B orders with pagination" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "B2B orders retrieved successfully" }),
    __param(0, (0, common_1.Query)('customerId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getB2BOrders", null);
__decorate([
    (0, common_1.Get)("orders/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B order by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "B2B order found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "B2B order not found" }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getB2BOrder", null);
__decorate([
    (0, common_1.Put)("orders/:id/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve B2B order" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "B2B order approved" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "B2B order not found" }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "approveB2BOrder", null);
__decorate([
    (0, common_1.Put)("orders/:id/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject B2B order" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "B2B order rejected" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "B2B order not found" }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "rejectB2BOrder", null);
__decorate([
    (0, common_1.Get)("customers"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B customers" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "B2B customers retrieved successfully" }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getB2BCustomers", null);
__decorate([
    (0, common_1.Get)("customers/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B customer by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "B2B customer found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "B2B customer not found" }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getB2BCustomer", null);
__decorate([
    (0, common_1.Get)("customers/:id/credit"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B customer credit information" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Credit information retrieved" }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getCustomerCredit", null);
__decorate([
    (0, common_1.Post)("d2d/transactions"),
    (0, swagger_1.ApiOperation)({ summary: "Create D2D (dealer-to-dealer) transaction" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "D2D transaction created successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Bad request" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "createD2DTransaction", null);
__decorate([
    (0, common_1.Get)("d2d/transactions"),
    (0, swagger_1.ApiOperation)({ summary: "Get D2D transactions" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "D2D transactions retrieved successfully" }),
    __param(0, (0, common_1.Query)('sellerId')),
    __param(1, (0, common_1.Query)('buyerId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getD2DTransactions", null);
__decorate([
    (0, common_1.Get)("pricing/:customerId"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B pricing for customer" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Pricing information retrieved" }),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getCustomerPricing", null);
__decorate([
    (0, common_1.Get)("analytics/sales"),
    (0, swagger_1.ApiOperation)({ summary: "Get B2B sales analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Sales analytics retrieved" }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('customerType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], B2BController.prototype, "getSalesAnalytics", null);
exports.B2BController = B2BController = __decorate([
    (0, swagger_1.ApiTags)("b2b"),
    (0, common_1.Controller)("b2b"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [b2b_service_1.B2BService])
], B2BController);
//# sourceMappingURL=b2b.controller.js.map