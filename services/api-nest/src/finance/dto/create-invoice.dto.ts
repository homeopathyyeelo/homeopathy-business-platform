import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from "class-validator"
import { Type } from "class-transformer"

export class InvoiceItemDto {
  @IsString()
  productId: string

  @IsString()
  description: string

  @IsNumber()
  quantity: number

  @IsNumber()
  unitPrice: number

  @IsNumber()
  taxRate: number

  @IsNumber()
  totalAmount: number
}

export class CreateInvoiceDto {
  @IsString()
  customerId: string

  @IsString()
  shopId: string

  @IsString()
  orderId?: string

  @IsEnum(["SALE", "PURCHASE", "SERVICE", "REFUND"])
  type: "SALE" | "PURCHASE" | "SERVICE" | "REFUND"

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[]

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsString()
  paymentTerms?: string

  @IsOptional()
  @IsString()
  dueDate?: string
}
