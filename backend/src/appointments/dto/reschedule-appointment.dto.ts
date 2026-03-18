import { IsString, IsDateString } from 'class-validator';

export class RescheduleAppointmentDto {

    @IsString()
    appointmentId: string;

    @IsDateString()
    newDate: string;

    @IsString()
    professionalId: string;
}