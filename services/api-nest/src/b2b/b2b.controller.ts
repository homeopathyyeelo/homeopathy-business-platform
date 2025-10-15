import { Controller, Get, Post, Body, Param, Query, Put, UseGuards, Req } from "@nestjs/common"
import { B2BService } from "./b2b.service"
import { AuthGuard } from "../guards/auth.guard"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags("b2b")
@Controller("b2b")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class B2BController {
  constructor(private readonly b2bService: B2BService) {}

  @Post("orders")
  @ApiOperation({ summary: "Create a B2B order" })
  @ApiResponse({ status: 201, description: "B2B order created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createB2BOrder(@Body() orderData: any, @Req() req: any) {
    // Add created_by from auth token
    orderData.created_by = req.user?.id
    return this.b2bService.createB2BOrder(orderData)
  }

  @Get("orders")
  @ApiOperation({ summary: "Get B2B orders with pagination" })
  @ApiResponse({ status: 200, description: "B2B orders retrieved successfully" })
  async getB2BOrders(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.b2bService.getB2BOrders(
      customerId,
      status,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    )
  }

  @Get("orders/:id")
  @ApiOperation({ summary: "Get B2B order by ID" })
  @ApiResponse({ status: 200, description: "B2B order found" })
  @ApiResponse({ status: 404, description: "B2B order not found" })
  async getB2BOrder(@Param('id') id: string) {
    return this.b2bService.getB2BOrder(id)
  }

  @Put("orders/:id/approve")
  @ApiOperation({ summary: "Approve B2B order" })
  @ApiResponse({ status: 200, description: "B2B order approved" })
  @ApiResponse({ status: 404, description: "B2B order not found" })
  async approveB2BOrder(@Param('id') id: string, @Req() req: any) {
    return this.b2bService.approveB2BOrder(id, req.user?.id)
  }

  @Put("orders/:id/reject")
  @ApiOperation({ summary: "Reject B2B order" })
  @ApiResponse({ status: 200, description: "B2B order rejected" })
  @ApiResponse({ status: 404, description: "B2B order not found" })
  async rejectB2BOrder(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.b2bService.rejectB2BOrder(id, reason, req.user?.id)
  }

  @Get("customers")
  @ApiOperation({ summary: "Get B2B customers" })
  @ApiResponse({ status: 200, description: "B2B customers retrieved successfully" })
  async getB2BCustomers(
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.b2bService.getB2BCustomers(
      type,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    )
  }

  @Get("customers/:id")
  @ApiOperation({ summary: "Get B2B customer by ID" })
  @ApiResponse({ status: 200, description: "B2B customer found" })
  @ApiResponse({ status: 404, description: "B2B customer not found" })
  async getB2BCustomer(@Param('id') id: string) {
    return this.b2bService.getB2BCustomer(id)
  }

  @Get("customers/:id/credit")
  @ApiOperation({ summary: "Get B2B customer credit information" })
  @ApiResponse({ status: 200, description: "Credit information retrieved" })
  async getCustomerCredit(@Param('id') id: string) {
    return this.b2bService.getCustomerCredit(id)
  }

  @Post("d2d/transactions")
  @ApiOperation({ summary: "Create D2D (dealer-to-dealer) transaction" })
  @ApiResponse({ status: 201, description: "D2D transaction created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createD2DTransaction(@Body() transactionData: any, @Req() req: any) {
    transactionData.created_by = req.user?.id
    return this.b2bService.createD2DTransaction(transactionData)
  }

  @Get("d2d/transactions")
  @ApiOperation({ summary: "Get D2D transactions" })
  @ApiResponse({ status: 200, description: "D2D transactions retrieved successfully" })
  async getD2DTransactions(
    @Query('sellerId') sellerId?: string,
    @Query('buyerId') buyerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.b2bService.getD2DTransactions(
      sellerId,
      buyerId,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    )
  }

  @Get("pricing/:customerId")
  @ApiOperation({ summary: "Get B2B pricing for customer" })
  @ApiResponse({ status: 200, description: "Pricing information retrieved" })
  async getCustomerPricing(@Param('customerId') customerId: string) {
    return this.b2bService.getCustomerPricing(customerId)
  }

  @Get("analytics/sales")
  @ApiOperation({ summary: "Get B2B sales analytics" })
  @ApiResponse({ status: 200, description: "Sales analytics retrieved" })
  async getSalesAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('customerType') customerType?: string,
  ) {
    return this.b2bService.getSalesAnalytics(startDate, endDate, customerType)
  }
}

