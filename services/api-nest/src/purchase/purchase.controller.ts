import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common"
import { PurchaseService } from "./purchase.service"
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto"
import { CreateVendorDto } from "./dto/create-vendor.dto"
import { AuthGuard } from "../guards/auth.guard"

@Controller("purchase")
@UseGuards(AuthGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // Vendor endpoints
  @Post("vendors")
  async createVendor(@Body() createVendorDto: CreateVendorDto) {
    return this.purchaseService.createVendor(createVendorDto)
  }

  @Get("vendors")
  async getVendors(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.purchaseService.getVendors(page, limit)
  }

  @Get("vendors/:id")
  async getVendor(@Param("id") id: string) {
    return this.purchaseService.getVendor(id)
  }

  @Put("vendors/:id")
  async updateVendor(
    @Param("id") id: string,
    @Body() updateData: Partial<CreateVendorDto>,
  ) {
    return this.purchaseService.updateVendor(id, updateData)
  }

  // Purchase Order endpoints
  @Post("orders")
  async createPurchaseOrder(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchaseService.createPurchaseOrder(createPurchaseOrderDto)
  }

  @Get("orders")
  async getPurchaseOrders(
    @Query("shopId") shopId?: string,
    @Query("vendorId") vendorId?: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.purchaseService.getPurchaseOrders(shopId, vendorId, status, page, limit)
  }

  @Get("orders/:id")
  async getPurchaseOrder(@Param("id") id: string) {
    return this.purchaseService.getPurchaseOrder(id)
  }

  @Put("orders/:id/status")
  async updatePurchaseOrderStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
  ): Promise<any> {
    return this.purchaseService.updatePurchaseOrderStatus(id, body.status)
  }

  // GRN endpoints
  @Post("grn")
  async createGRN(
    @Body() body: {
      purchaseOrderId: string
      receivedItems: Array<{ itemId: string; receivedQuantity: number; condition: string }>
    },
  ): Promise<any> {
    return this.purchaseService.createGRN(body.purchaseOrderId, body.receivedItems)
  }

  // Analytics endpoints
  @Get("analytics")
  async getPurchaseAnalytics(
    @Query("shopId") shopId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ): Promise<any> {
    return this.purchaseService.getPurchaseAnalytics(
      shopId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    )
  }
}
