export declare class AIService {
    generateContent(request: any): Promise<{
        text: string;
        model: any;
        usage: {
            tokens: number;
        };
    }>;
    generateEmbeddings(request: any): Promise<{
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
    getRequests(requestorUserId?: string, modelId?: string, page?: number, limit?: number): Promise<{
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
    forecastDemand(request: any): Promise<{
        productId: any;
        forecast: {
            nextWeek: number;
            nextMonth: number;
        };
    }>;
    calculateDynamicPricing(request: any): Promise<{
        recommendedPrice: number;
        confidence: number;
        factors: string[];
    }>;
    generateCampaignContent(request: any): Promise<{
        campaignId: any;
        content: {
            title: string;
            description: string;
            cta: string;
        };
    }>;
    generateProductRecommendations(request: any): Promise<{
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
