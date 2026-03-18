import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getDashboard(salonId: string, role?: string, professionalId?: string) {
        const now = new Date();

        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const endMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
        );

        const whereClause: any = {
            salonId,
            status: 'COMPLETED',
            date: {
                gte: startMonth,
                lte: endMonth,
            },
        };

        if (role === 'PROFESSIONAL' && professionalId) {
            whereClause.professionalId = professionalId;
        }

        const appointments = await this.prisma.appointment.findMany({
            where: whereClause,
            include: {
                client: true,
                service: true,
                professional: true,
                payment: true,
            },
        });

        const clientMap: Record<string, number> = {};
        const serviceMap: Record<string, number> = {};
        const professionalMap: Record<string, { count: number; revenue: number }> = {};

        for (const a of appointments) {
            const price = a.payment?.amount ?? 0;

            clientMap[a.client.name] =
                (clientMap[a.client.name] || 0) + price;

            serviceMap[a.service.name] =
                (serviceMap[a.service.name] || 0) + 1;

            if (!professionalMap[a.professional.name]) {
                professionalMap[a.professional.name] = { count: 0, revenue: 0 };
            }
            professionalMap[a.professional.name].count += 1;
            professionalMap[a.professional.name].revenue += price;
        }

        const topClients = Object.entries(clientMap)
            .map(([name, spent]) => ({ name, spent }))
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 5);

        const topServices = Object.entries(serviceMap)
            .map(([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        let topProfessionals: any[] = [];
        // Apenas Admin e Manager veem os top colaboradores
        if (role !== 'PROFESSIONAL') {
            topProfessionals = Object.entries(professionalMap)
                .map(([professional, data]) => {
                    // Admin vê faturamento + quantidade
                    if (role === 'ADMIN') {
                        return { professional, count: data.count, revenue: data.revenue };
                    }
                    // Gerentes (MANAGER) veem apenas quantidade de serviços realizados
                    return { professional, count: data.count };
                })
                .sort((a: any, b: any) => {
                     // Admin ordena pelo faturamento, gerente ordena pela quantidade
                     return role === 'ADMIN' ? b.revenue - a.revenue : b.count - a.count;
                })
                .slice(0, 5);
        }

        return {
            topClients,
            topServices,
            topProfessionals,
        };
    }
}