import useSWR from 'swr';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export interface CategoryStat {
    category: string;
    count: number;
}

export interface MonthStat {
    year: number;
    month: string;
    count: number;
}

export interface Suggestion {
    category: string;
    title: string;
    content: string;
}

export function useGmbAnalyticsByCategory() {
    const { data, error, isLoading } = useSWR<{ data: CategoryStat[] }>(
        'http://localhost:3005/api/social/gmb/analytics?groupBy=category',
        fetcher
    );
    return {
        data: data?.data || [],
        isLoading,
        isError: error
    };
}

export function useGmbAnalyticsByMonth() {
    const { data, error, isLoading } = useSWR<{ data: MonthStat[] }>(
        'http://localhost:3005/api/social/gmb/analytics?groupBy=month',
        fetcher
    );
    return {
        data: data?.data || [],
        isLoading,
        isError: error
    };
}

export function useGmbMissingCategories() {
    const { data, error, isLoading } = useSWR<{ data: string[] }>(
        'http://localhost:3005/api/social/gmb/analytics?groupBy=missing',
        fetcher
    );
    return {
        data: data?.data || [],
        isLoading,
        isError: error
    };
}

export function useGmbAnalyticsBySubCategory(accountID: string | null) {
    const { data, error, isLoading } = useSWR<{ data: CategoryStat[] }>(
        accountID ? `http://localhost:3005/api/social/gmb/analytics?groupBy=subcategory&accountId=${accountID}` : 'http://localhost:3005/api/social/gmb/analytics?groupBy=subcategory',
        fetcher
    );
    return {
        data: data?.data || [],
        isLoading,
        isError: error
    };
}

export function useGmbAISuggestions(accountID: string | null) {
    const { data, error, isLoading } = useSWR<{ data: Suggestion[] }>(
        accountID ? `http://localhost:3005/api/social/gmb/analytics?groupBy=ai&accountId=${accountID}` : 'http://localhost:3005/api/social/gmb/analytics?groupBy=ai',
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );
    return {
        suggestions: data?.data || [],
        isLoading,
        isError: error
    };
}
