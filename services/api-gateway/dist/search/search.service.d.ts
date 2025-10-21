export declare class SearchService {
    private readonly serviceUrls;
    search(query: string, type?: string, limit?: number): Promise<{
        success: boolean;
        data: {
            results: never[];
            total: number;
            query?: undefined;
        };
    } | {
        success: boolean;
        data: {
            query: string;
            results: {};
            total: number;
        };
    }>;
    private searchProducts;
    private searchCustomers;
    private searchInvoices;
}
//# sourceMappingURL=search.service.d.ts.map