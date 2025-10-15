import { Controller, Get, Post, Body, Param, Query, Put, UseGuards, Req } from "@nestjs/common"
import { OrdersService } from "./orders.service"
import type { CreateOrderDto } from "./dto/create-order.dto"
import { AuthGuard } from "../guards/auth.guard"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags("orders")
@Controller("orders")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createOrder(createOrderDto: CreateOrderDto, @Req() req: any) {
    // Add user ID from auth token if not provided
    if (!createOrderDto.userId && req.user?.id) {
      createOrderDto.userId = req.user.id
    }

    return this.ordersService.createOrder(createOrderDto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id)
  }

  @Get()
  @ApiOperation({ summary: "Get orders with pagination" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  async getOrders(
    @Query('shopId') shopId?: string,
    @Query('customerId') customerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.getOrders(
      shopId,
      customerId,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    )
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update order status" })
  @ApiResponse({ status: 200, description: "Order status updated" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.ordersService.updateOrderStatus(id, status, req.user?.id)
  }
}
