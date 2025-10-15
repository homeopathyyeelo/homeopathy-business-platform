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
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const auth_guard_1 = require("../guards/auth.guard");
const swagger_1 = require("@nestjs/swagger");
let AIController = class AIController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateContent(request, req) {
        return this.aiService.generateContent({
            ...request,
            requestor_user_id: req.user?.id
        });
    }
    async generateEmbeddings(request, req) {
        return this.aiService.generateEmbeddings({
            ...request,
            requestor_user_id: req.user?.id
        });
    }
    async getModels() {
        return this.aiService.getModels();
    }
    async getPrompts(key, language) {
        return this.aiService.getPrompts(key, language);
    }
    async getRequests(requestorUserId, modelId, page, limit) {
        return this.aiService.getRequests(requestorUserId, modelId, page ? Number.parseInt(page) : 1, limit ? Number.parseInt(limit) : 20);
    }
    async getRequest(id) {
        return this.aiService.getRequest(id);
    }
    async forecastDemand(request, req) {
        return this.aiService.forecastDemand({
            ...request,
            requestor_user_id: req.user?.id
        });
    }
    async calculateDynamicPricing(request, req) {
        return this.aiService.calculateDynamicPricing({
            ...request,
            requestor_user_id: req.user?.id
        });
    }
    async generateCampaignContent(request, req) {
        return this.aiService.generateCampaignContent({
            ...request,
            requestor_user_id: req.user?.id
        });
    }
    async generateProductRecommendations(request, req) {
        return this.aiService.generateProductRecommendations({
            ...request,
            requestor_user_id: req.user?.id
        });
    }
    async getUsageAnalytics(startDate, endDate, modelId) {
        return this.aiService.getUsageAnalytics(startDate, endDate, modelId);
    }
};
exports.AIController = AIController;
__decorate([
    (0, common_1.Post)("generate"),
    (0, swagger_1.ApiOperation)({ summary: "Generate AI content" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Content generated successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Bad request" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateContent", null);
__decorate([
    (0, common_1.Post)("embed"),
    (0, swagger_1.ApiOperation)({ summary: "Generate embeddings for text" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Embeddings generated successfully" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateEmbeddings", null);
__decorate([
    (0, common_1.Get)("models"),
    (0, swagger_1.ApiOperation)({ summary: "Get available AI models" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Models retrieved successfully" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AIController.prototype, "getModels", null);
__decorate([
    (0, common_1.Get)("prompts"),
    (0, swagger_1.ApiOperation)({ summary: "Get AI prompt templates" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Prompts retrieved successfully" }),
    __param(0, (0, common_1.Query)('key')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "getPrompts", null);
__decorate([
    (0, common_1.Get)("requests"),
    (0, swagger_1.ApiOperation)({ summary: "Get AI request history" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Requests retrieved successfully" }),
    __param(0, (0, common_1.Query)('requestor_user_id')),
    __param(1, (0, common_1.Query)('model_id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Get)("requests/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get AI request by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Request found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Request not found" }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Post)("forecast/demand"),
    (0, swagger_1.ApiOperation)({ summary: "Generate demand forecast" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Forecast generated successfully" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "forecastDemand", null);
__decorate([
    (0, common_1.Post)("pricing/dynamic"),
    (0, swagger_1.ApiOperation)({ summary: "Calculate dynamic pricing" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Pricing calculated successfully" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "calculateDynamicPricing", null);
__decorate([
    (0, common_1.Post)("content/campaign"),
    (0, swagger_1.ApiOperation)({ summary: "Generate campaign content" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Campaign content generated successfully" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateCampaignContent", null);
__decorate([
    (0, common_1.Post)("recommendations/products"),
    (0, swagger_1.ApiOperation)({ summary: "Generate product recommendations" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Recommendations generated successfully" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateProductRecommendations", null);
__decorate([
    (0, common_1.Get)("analytics/usage"),
    (0, swagger_1.ApiOperation)({ summary: "Get AI usage analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Usage analytics retrieved" }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "getUsageAnalytics", null);
exports.AIController = AIController = __decorate([
    (0, swagger_1.ApiTags)("ai"),
    (0, common_1.Controller)("ai"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ai_service_1.AIService])
], AIController);
//# sourceMappingURL=ai.controller.js.map