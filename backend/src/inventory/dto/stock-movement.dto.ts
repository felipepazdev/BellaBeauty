import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
}

export class StockMovementDto {
    @ApiProperty({ enum: MovementType })
    @IsEnum(MovementType)
    type: string;

    @ApiProperty()
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    reason?: string;
}
