"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const shared_db_1 = require("@yeelo/shared-db");
let OutboxService = class OutboxService {
    async createEvent(tx, event) {
        await tx.outbox.create({
            data: {
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                payload: event.payload,
                status: "PENDING",
            },
        });
    }
    async getUnprocessedEvents(limit = 100) {
        return shared_db_1.prisma.outbox.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            take: limit,
        });
    }
    async markEventProcessed(id) {
        return shared_db_1.prisma.outbox.update({
            where: { id },
            data: {
                status: "PROCESSED",
                processedAt: new Date(),
            },
        });
    }
    async markEventFailed(id, retryCount) {
        if (retryCount >= 3) {
            const event = await shared_db_1.prisma.outbox.findUnique({ where: { id } });
            if (event) {
                await shared_db_1.prisma.outboxDlq.create({
                    data: {
                        eventType: event.eventType,
                        aggregateId: event.aggregateId,
                        payload: event.payload,
                        error: "Max retries exceeded",
                        retryCount,
                    },
                });
                await shared_db_1.prisma.outbox.delete({ where: { id } });
            }
        }
        else {
            await shared_db_1.prisma.outbox.update({
                where: { id },
                data: {
                    status: "PENDING",
                    retryCount: retryCount + 1,
                },
            });
        }
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)()
], OutboxService);
//# sourceMappingURL=outbox.service.js.map