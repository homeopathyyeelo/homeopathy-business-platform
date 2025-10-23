import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  SALES_REP = 'SALES_REP',
  PURCHASE_MANAGER = 'PURCHASE_MANAGER',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
  HR_MANAGER = 'HR_MANAGER',
  MARKETING = 'MARKETING',
  ANALYST = 'ANALYST',
  CASHIER = 'CASHIER',
}

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'SALES_REP', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: string;
}
