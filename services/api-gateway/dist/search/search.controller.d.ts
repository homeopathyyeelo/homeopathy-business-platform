import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
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
}
//# sourceMappingURL=search.controller.d.ts.map