import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateExpenseDto {
    @ApiProperty({ description: 'Categoria da despesa (Ex: RENT, MATERIAL, SALARY, PRO_LABORE, PRODUCT, OTHER)'})
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
