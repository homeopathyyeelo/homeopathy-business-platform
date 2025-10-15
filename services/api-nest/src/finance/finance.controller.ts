import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common"
import { FinanceService } from "./finance.service"
import { CreateInvoiceDto } from "./dto/create-invoice.dto"
import { AuthGuard } from "../guards/auth.guard"

@Controller("finance")
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Invoice endpoints
  @Post("invoices")
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.financeService.createInvoice(createInvoiceDto)
  }

  @Get("invoices")
  async getInvoices(
    @Query("shopId") shopId?: string,
    @Query("customerId") customerId?: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.financeService.getInvoices(shopId, customerId, status, page, limit)
  }

  @Get("invoices/:id")
  async getInvoice(@Param("id") id: string) {
    return this.financeService.getInvoice(id)
  }

  @Put("invoices/:id/status")
  async updateInvoiceStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
  ) {
    return this.financeService.updateInvoiceStatus(id, body.status)
  }

  // Payment endpoints
  @Post("payments")
  async recordPayment(
    @Body() body: {
      invoiceId: string
      amount: number
      paymentMethod: string
      reference?: string
    },
  ) {
    return this.financeService.recordPayment(
      body.invoiceId,
      body.amount,
      body.paymentMethod,
      body.reference,
    )
  }

  // Reports endpoints
  @Get("reports/profit-loss")
  async getProfitLossReport(
    @Query("shopId") shopId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return this.financeService.getProfitLossReport(
      shopId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    )
  }

  @Get("reports/cash-flow")
  async getCashFlowReport(
    @Query("shopId") shopId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return this.financeService.getCashFlowReport(
      shopId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    )
  }

  @Get("reports/gst")
  async getGSTReport(
    @Query("shopId") shopId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    return this.financeService.getGSTReport(
      shopId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    )
  }

  // Currency endpoints
  @Get("currency/rates")
  async getCurrencyRates() {
    return this.financeService.getCurrencyRates()
  }

  @Get("currency/convert")
  async convertCurrency(
    @Query("amount") amount: number,
    @Query("from") fromCurrency: string,
    @Query("to") toCurrency: string,
  ) {
    return this.financeService.convertCurrency(amount, fromCurrency, toCurrency)
  }
}
