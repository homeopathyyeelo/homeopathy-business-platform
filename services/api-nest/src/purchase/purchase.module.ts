import { Module } from "@nestjs/common"
import { PurchaseController } from "./purchase.controller"
import { PurchaseService } from "./purchase.service"
import { PrismaModule } from "../prisma/prisma.module"
import { OutboxModule } from "../outbox/outbox.module"

@Module({
  imports: [PrismaModule, OutboxModule],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
