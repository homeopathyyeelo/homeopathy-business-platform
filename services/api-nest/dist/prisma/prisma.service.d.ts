import { OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@yeelo/shared-db/generated/client";
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
