interface OutboxEvent {
    eventType: string;
    aggregateId: string;
    payload: any;
}
export declare class OutboxService {
    createEvent(tx: any, event: OutboxEvent): Promise<void>;
    getUnprocessedEvents(limit?: number): Promise<{
        id: string;
        eventType: string;
        aggregateId: string;
        payload: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue;
        status: import("@yeelo/shared-db").$Enums.OutboxStatus;
        retryCount: number;
        createdAt: Date;
        processedAt: Date | null;
    }[]>;
    markEventProcessed(id: string): Promise<{
        id: string;
        eventType: string;
        aggregateId: string;
        payload: import("@yeelo/shared-db/generated/client/runtime/library").JsonValue;
        status: import("@yeelo/shared-db").$Enums.OutboxStatus;
        retryCount: number;
        createdAt: Date;
        processedAt: Date | null;
    }>;
    markEventFailed(id: string, retryCount: number): Promise<void>;
}
export {};
