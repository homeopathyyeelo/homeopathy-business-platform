import { AIService } from "./ai.service";
export declare class AIController {
    private readonly aiService;
    constructor(aiService: AIService);
    generateContent(request: {
        prompt_key: string;
        context?: any;
        model?: string;
    }, req: any): Promise<{
        text: string;
        model: any;
        usage: {
            tokens: number;
        };
    }>;
    generateEmbeddings(request: {
        texts: string[];
        model?: string;
    }, req: any): Promise<{
        vectors: any;
        model: any;
    }>;
    getModels(): Promise<{
        models: {
            id: string;
            name: string;
            type: string;
        }[];
    }>;
    getPrompts(key?: string, language?: string): Promise<{
        prompts: {
            key: string;
            template: string;
            language: string;
        }[];
    }>;
    getRequests(requestorUserId?: string, modelId?: string, page?: string, limit?: string): Promise<{
        requests: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getRequest(id: string): Promise<{
        id: string;
        status: string;
        response: string;
    }>;
    forecastDemand(request: {
        product_id: string;
        shop_id: string;
        days_ahead?: number;
    }, req: any): Promise<{
        productId: any;
        forecast: {
            nextWeek: number;
            nextMonth: number;
        };
    }>;
    calculateDynamicPricing(request: {
        product_id: string;
        current_price: number;
        current_stock: number;
        expiry_date?: string;
        demand_forecast?: number;
        cost_price: number;
    }, req: any): Promise<{
        recommendedPrice: number;
        confidence: number;
        factors: string[];
    }>;
    generateCampaignContent(request: {
        campaign_id: string;
        type: string;
        target_audience: any;
    }, req: any): Promise<{
        campaignId: any;
        content: {
            title: string;
            description: string;
            cta: string;
        };
    }>;
    generateProductRecommendations(request: {
        customer_id: string;
        order_items: any[];
    }, req: any): Promise<{
        customerId: any;
        recommendations: {
            productId: string;
            score: number;
            reason: string;
        }[];
    }>;
    getUsageAnalytics(startDate?: string, endDate?: string, modelId?: string): Promise<{
        totalRequests: number;
        totalTokens: number;
        avgResponseTime: number;
        topModels: {
            model: string;
            requests: number;
        }[];
    }>;
}
