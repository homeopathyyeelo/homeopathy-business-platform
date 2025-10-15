import { Injectable } from "@nestjs/common"
import { prisma } from "@yeelo/shared-db"

interface OutboxEvent {
  eventType: string
  aggregateId: string
  payload: any
}

@Injectable()
export class OutboxService {
  async createEvent(tx: any, event: OutboxEvent): Promise<void> {
    await tx.outbox.create({
      data: {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        payload: event.payload,
        status: "PENDING",
      },
    })
  }

  async getUnprocessedEvents(limit = 100) {
    return prisma.outbox.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: limit,
    })
  }

  async markEventProcessed(id: string) {
    return prisma.outbox.update({
      where: { id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    })
  }

  async markEventFailed(id: string, retryCount: number) {
    if (retryCount >= 3) {
      // Move to DLQ after 3 retries
      const event = await prisma.outbox.findUnique({ where: { id } })
      if (event) {
        await prisma.outboxDlq.create({
          data: {
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            error: "Max retries exceeded",
            retryCount,
          },
        })
        await prisma.outbox.delete({ where: { id } })
      }
    } else {
      await prisma.outbox.update({
        where: { id },
        data: {
          status: "PENDING",
          retryCount: retryCount + 1,
        },
      })
    }
  }
}
