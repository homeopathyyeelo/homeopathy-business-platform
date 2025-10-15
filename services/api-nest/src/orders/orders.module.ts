import { Module } from "@nestjs/common"
import { OrdersController } from "./orders.controller"
import { OrdersService } from "./orders.service"
import { RedisModule } from "../redis/redis.module"
import { OutboxModule } from "../outbox/outbox.module"
import { AuthGuard } from "../guards/auth.guard"

@Module({
  imports: [RedisModule, OutboxModule],
  controllers: [OrdersController],
  providers: [OrdersService, AuthGuard],
})
export class OrdersModule {}
