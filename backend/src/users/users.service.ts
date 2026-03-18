import {
    Injectable,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findProfessionals(salonId: string) {
        const users = await this.prisma.user.findMany({
            where: { salonId, role: 'PROFESSIONAL', professionalId: { not: null }, isActive: true },
            select: {
                id: true,
                name: true,
                professionalId: true,
                professional: { 
                    select: { 
                        niches: { select: { id: true, name: true } },
                        services: { select: { id: true } }
                    } 
                }
            },
        });
        return users.map(u => ({ 
            id: u.professionalId, 
            name: u.name, 
            niches: u.professional?.niches || [],
            serviceIds: u.professional?.services.map(s => s.id) || []
        }));
    }

    async findAll(salonId: string, status: 'active' | 'inactive' | 'all' = 'active') {
        const where: any = { salonId };
        
        if (status === 'active') where.isActive = true;
        else if (status === 'inactive') where.isActive = false;

        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                permissions: true,
                isActive: true,
                createdAt: true,
                professional: {
                    select: {
                        id: true,
                        niches: true,
                        services: { select: { id: true, name: true } },
                        commission: true,
                        contractType: true
                    }
                }
            },
        });
    }

    async findOne(id: string, salonId: string) {
        return this.prisma.user.findFirst({
            where: {
                id,
                salonId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                permissions: true,
                createdAt: true,
                professional: {
                    select: {
                        id: true,
                        niches: true,
                        services: { select: { id: true, name: true } },
                        commission: true,
                        contractType: true
                    }
                }
            },
        });
    }

    async create(
        salonId: string,
        data: {
            name: string;
            email: string;
            password: string;
            role?: string;
            nicheIds?: string[];
            serviceIds?: string[];
            commission?: number;
            contractType?: string;
            permissions?: string;
        },
    ) {
        const { nicheIds, serviceIds, commission, contractType, permissions, ...userData } = data;
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const resolvedRole = userData.role || 'ADMIN';

        return this.prisma.$transaction(async (tx) => {
            let professionalId: string | null = null;

            if (resolvedRole === 'PROFESSIONAL') {
                const prof = await tx.professional.create({
                    data: {
                        name: userData.name,
                        salonId,
                        commission: commission !== undefined ? commission : 50,
                        contractType: contractType || 'COMMISSION',
                        niches: nicheIds?.length
                            ? { connect: nicheIds.map(id => ({ id })) }
                            : undefined,
                        services: serviceIds?.length
                            ? { connect: serviceIds.map(id => ({ id })) }
                            : undefined,
                    },
                });
                professionalId = prof.id;
            }

            return tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: hashedPassword,
                    role: resolvedRole,
                    salonId,
                    professionalId,
                    permissions,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    permissions: true,
                    isActive: true,
                    professional: {
                        select: {
                            id: true,
                            niches: true,
                            commission: true,
                            contractType: true
                        }
                    }
                }
            });
        });
    }

    async update(
        id: string,
        salonId: string,
        data: { 
            name?: string; 
            email?: string; 
            nicheIds?: string[]; 
            serviceIds?: string[]; 
            commission?: number; 
            contractType?: string; 
            permissions?: string;
        },
    ) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findFirst({
                where: { id, salonId },
            });
            if (!user) throw new Error('User not found');

            const { nicheIds, serviceIds, commission, contractType, permissions, ...userData } = data;

            if (Object.keys(userData).length > 0 || permissions !== undefined) {
                await tx.user.update({
                    where: { id },
                    data: {
                        ...userData,
                        permissions,
                    },
                });
            }

            if (user.role === 'PROFESSIONAL' && user.professionalId) {
                const profUpdate: any = {};
                if (nicheIds !== undefined) {
                    profUpdate.niches = { set: nicheIds.map(id => ({ id })) };
                }
                if (serviceIds !== undefined) {
                    profUpdate.services = { set: serviceIds.map(id => ({ id })) };
                }
                if (commission !== undefined) profUpdate.commission = commission;
                if (contractType !== undefined) profUpdate.contractType = contractType;

                if (Object.keys(profUpdate).length > 0) {
                    await tx.professional.update({
                        where: { id: user.professionalId },
                        data: profUpdate
                    });
                }
            }

            return tx.user.findUnique({ 
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    permissions: true,
                    isActive: true,
                    professional: {
                        select: {
                            id: true,
                            niches: true,
                            commission: true,
                            contractType: true
                        }
                    }
                }
            });
        });
    }

    async delete(id: string, salonId: string) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findFirst({
                where: { id, salonId }
            });

            if (!user) throw new Error('User not found');

            // Soft Delete: Inativa o usuário
            await tx.user.update({
                where: { id },
                data: { isActive: false }
            });

            // Se for profissional, inativa o registro de profissional também
            if (user.professionalId) {
                await tx.professional.update({
                    where: { id: user.professionalId },
                    data: { isActive: false }
                });
            }

            return { success: true };
        });
    }

    async updateWorkingHours(professionalId: string, salonId: string, schedule: { dayOfWeek: number; startTime: string; endTime: string; }[]) {
        // Validações
        for (const slot of schedule) {
            if (slot.startTime >= slot.endTime) {
                throw new BadRequestException('Horário de término deve ser após o início');
            }
        }

        // Verifica overlaps
        const days = Array.from({ length: 7 }, (_, i) => i);
        for (const day of days) {
            const daySlots = schedule.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
            for (let i = 0; i < daySlots.length - 1; i++) {
                if (daySlots[i].endTime > daySlots[i + 1].startTime) {
                    throw new ConflictException(`Sobreposição de horários detectada no dia ${day}`);
                }
            }
        }

        return this.prisma.$transaction(async (tx) => {
            // Remove antigos
            await tx.professionalSchedule.deleteMany({
                where: { professionalId }
            });

            // Cria novos
            return tx.professionalSchedule.createMany({
                data: schedule.map(s => ({
                    professionalId,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime
                }))
            });
        });
    }

    async getWorkingHours(professionalId: string) {
        return this.prisma.professionalSchedule.findMany({
            where: { professionalId },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
    }
}