import { Controller, Get, Post, Body, Query } from "@nestjs/common"
import { InventoryService } from "./inventory.service"

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("summary")
  getSummary(@Query("shopId") shopId: string) {
    return this.inventoryService.getSummary(shopId)
  }

  @Get("low-stock")
  lowStock(@Query("shopId") shopId: string) {
    return this.inventoryService.lowStock(shopId)
  }

  @Post("add")
  addStock(
    @Body()
    body: { productId: string; shopId: string; quantity: number; batchNo?: string; expiryDate?: string },
  ) {
    const { productId, shopId, quantity, batchNo, expiryDate } = body
    return this.inventoryService.addStock(
      productId,
      shopId,
      quantity,
      batchNo,
      expiryDate ? new Date(expiryDate) : undefined,
    )
  }

  @Post("adjust")
  adjustStock(@Body() body: { productId: string; shopId: string; quantityDelta: number; batchNo?: string }) {
    const { productId, shopId, quantityDelta, batchNo } = body
    return this.inventoryService.adjustStock(productId, shopId, quantityDelta, batchNo)
  }
}
