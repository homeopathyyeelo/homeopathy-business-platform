import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from "@nestjs/common"
import { AIService } from "./ai.service"
import { AuthGuard } from "../guards/auth.guard"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"

@ApiTags("ai")
@Controller("ai")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate AI content" })
  @ApiResponse({ status: 200, description: "Content generated successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async generateContent(@Body() request: {
    prompt_key: string
    context?: any
    model?: string
  }, @Req() req: any) {
    return this.aiService.generateContent({
      ...request,
      requestor_user_id: req.user?.id
    })
  }

  @Post("embed")
  @ApiOperation({ summary: "Generate embeddings for text" })
  @ApiResponse({ status: 200, description: "Embeddings generated successfully" })
  async generateEmbeddings(@Body() request: {
    texts: string[]
    model?: string
  }, @Req() req: any) {
    return this.aiService.generateEmbeddings({
      ...request,
      requestor_user_id: req.user?.id
    })
  }

  @Get("models")
  @ApiOperation({ summary: "Get available AI models" })
  @ApiResponse({ status: 200, description: "Models retrieved successfully" })
  async getModels() {
    return this.aiService.getModels()
  }

  @Get("prompts")
  @ApiOperation({ summary: "Get AI prompt templates" })
  @ApiResponse({ status: 200, description: "Prompts retrieved successfully" })
  async getPrompts(
    @Query('key') key?: string,
    @Query('language') language?: string
  ) {
    return this.aiService.getPrompts(key, language)
  }

  @Get("requests")
  @ApiOperation({ summary: "Get AI request history" })
  @ApiResponse({ status: 200, description: "Requests retrieved successfully" })
  async getRequests(
    @Query('requestor_user_id') requestorUserId?: string,
    @Query('model_id') modelId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiService.getRequests(
      requestorUserId,
      modelId,
      page ? Number.parseInt(page) : 1,
      limit ? Number.parseInt(limit) : 20,
    )
  }

  @Get("requests/:id")
  @ApiOperation({ summary: "Get AI request by ID" })
  @ApiResponse({ status: 200, description: "Request found" })
  @ApiResponse({ status: 404, description: "Request not found" })
  async getRequest(@Param('id') id: string) {
    return this.aiService.getRequest(id)
  }

  @Post("forecast/demand")
  @ApiOperation({ summary: "Generate demand forecast" })
  @ApiResponse({ status: 200, description: "Forecast generated successfully" })
  async forecastDemand(@Body() request: {
    product_id: string
    shop_id: string
    days_ahead?: number
  }, @Req() req: any) {
    return this.aiService.forecastDemand({
      ...request,
      requestor_user_id: req.user?.id
    })
  }

  @Post("pricing/dynamic")
  @ApiOperation({ summary: "Calculate dynamic pricing" })
  @ApiResponse({ status: 200, description: "Pricing calculated successfully" })
  async calculateDynamicPricing(@Body() request: {
    product_id: string
    current_price: number
    current_stock: number
    expiry_date?: string
    demand_forecast?: number
    cost_price: number
  }, @Req() req: any) {
    return this.aiService.calculateDynamicPricing({
      ...request,
      requestor_user_id: req.user?.id
    })
  }

  @Post("content/campaign")
  @ApiOperation({ summary: "Generate campaign content" })
  @ApiResponse({ status: 200, description: "Campaign content generated successfully" })
  async generateCampaignContent(@Body() request: {
    campaign_id: string
    type: string
    target_audience: any
  }, @Req() req: any) {
    return this.aiService.generateCampaignContent({
      ...request,
      requestor_user_id: req.user?.id
    })
  }

  @Post("recommendations/products")
  @ApiOperation({ summary: "Generate product recommendations" })
  @ApiResponse({ status: 200, description: "Recommendations generated successfully" })
  async generateProductRecommendations(@Body() request: {
    customer_id: string
    order_items: any[]
  }, @Req() req: any) {
    return this.aiService.generateProductRecommendations({
      ...request,
      requestor_user_id: req.user?.id
    })
  }

  @Get("analytics/usage")
  @ApiOperation({ summary: "Get AI usage analytics" })
  @ApiResponse({ status: 200, description: "Usage analytics retrieved" })
  async getUsageAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('modelId') modelId?: string
  ) {
    return this.aiService.getUsageAnalytics(startDate, endDate, modelId)
  }
}

