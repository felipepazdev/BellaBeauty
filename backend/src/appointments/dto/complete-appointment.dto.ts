import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteAppointmentDto {
  @ApiProperty({ example: 'CARD', description: 'Forma de pagamento' })
  @IsString()
  method: string;

  @ApiProperty({ example: 2.5, description: 'Taxa de cartão/transação', required: false })
  @IsOptional()
  @IsNumber()
  fee?: number;
}
