import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
    @IsNumber()
    amount: number;

    @IsString()
    method: string;

    @IsString()
    appointmentId: string;
}