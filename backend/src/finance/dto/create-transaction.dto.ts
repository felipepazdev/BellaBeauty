import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
    @ApiProperty({ enum: TransactionType })
    @IsEnum(TransactionType)
    type: string;

    @ApiProperty()
    @IsString()
    category: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    amount: number;
}
