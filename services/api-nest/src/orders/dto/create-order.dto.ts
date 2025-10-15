import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, Min } from "class-validator"
import { Type } from "class-transformer"
import { OrderType, PaymentStatus } from "@yeelo/shared-db"

export class CreateOrderItemDto {
  @IsString()
  productId: string

  @IsNumber()
  @Min(1)
  quantity: number

  @IsNumber()
  @Min(0)
  price: number
}

export class CreateOrderDto {
  @IsString()
  customerId: string

  @IsString()
  shopId: string

  @IsOptional()
  @IsString()
  userId?: string

  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType = OrderType.WALK_IN

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus = PaymentStatus.PENDING

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]

  @IsOptional()
  @IsString()
  idempotencyKey?: string
}
