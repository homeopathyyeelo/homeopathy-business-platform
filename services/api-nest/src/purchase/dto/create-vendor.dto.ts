import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber } from "class-validator"

export class CreateVendorDto {
  @IsString()
  name: string

  @IsString()
  contactPerson: string

  @IsString()
  phone: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  gstNumber?: string

  @IsOptional()
  @IsNumber()
  creditLimit?: number

  @IsOptional()
  @IsNumber()
  paymentTerms?: number // days

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
