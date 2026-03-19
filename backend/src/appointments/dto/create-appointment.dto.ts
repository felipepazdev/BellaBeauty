import { IsUUID, IsISO8601, IsOptional, IsInt, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  professionalId: string;

  @IsUUID()
  serviceId: string;

  @IsISO8601()
  date: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}
