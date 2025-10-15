import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsDateString } from "class-validator"
import { Type } from "class-transformer"

export class CreatePurchaseOrderItemDto {
  @IsString()
  productId: string

  @IsNumber()
  quantity: number

  @IsNumber()
  unitPrice: number

  @IsOptional()
  @IsString()
  batchNo?: string

  @IsOptional()
  @IsDateString()
  expiryDate?: string
}

export class CreatePurchaseOrderDto {
  @IsString()
  vendorId: string

  @IsString()
  shopId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[]

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string
}
