import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class FinanceRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  type?: 'ENTRADA' | 'SAIDA' | 'INCOME' | 'EXPENSE';

  @ApiPropertyOptional()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  method?: string;
}
