import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommissionsService {
    constructor(private prisma: PrismaService) { }

    async createCommission(appointmentId: string) {
        // ... Lógica antiga
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { service: true, professional: true },
        });

        if (!appointment) throw new Error('Agendamento não encontrado');

        const commissionValue = (appointment.service.price * appointment.professional.commission) / 100;

        return this.prisma.commission.create({
            data: {
                amount: commissionValue,
                professionalId: appointment.professionalId,
                appointmentId: appointment.id,
            },
        });
    }

    async findAll(
        salonId: string, 
        role?: string, 
        professionalId?: string,
        year?: number,
        month?: number
    ) {
        let whereClause: any = { appointment: { salonId } };

        if (professionalId) {
            whereClause.professionalId = professionalId;
        }

        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            
            whereClause.appointment = {
                ...whereClause.appointment,
                date: {
                    gte: startDate,
                    lt: endDate
                }
            };
        }

        return this.prisma.commission.findMany({
            where: whereClause,
            include: {
                professional: true,
                appointment: {
                    include: { client: true, service: true },
                },
            },
            orderBy: { id: 'desc' },
        });
    }

    async getProfessionalCommissions(professionalId: string) {
        return this.prisma.commission.findMany({
            where: { professionalId },
            include: { appointment: { include: { client: true, service: true } } },
        });
    }
}