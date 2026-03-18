import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateOrderDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    clientId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: 'OPEN' | 'CLOSED' | 'CANCELLED';
}
