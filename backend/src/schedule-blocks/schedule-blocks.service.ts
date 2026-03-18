import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';

@Injectable()
export class ScheduleBlocksService {

    constructor(private prisma: PrismaService) { }

    async create(dto: CreateScheduleBlockDto, salonId: string) {
        return this.prisma.scheduleBlock.create({
            data: {
                salonId,
                professionalId: dto.professionalId,
                start: new Date(dto.start),
                end: new Date(dto.end),
                reason: dto.reason,
            },
        });
    }

    async findAll(salonId: string) {
        return this.prisma.scheduleBlock.findMany({
            where: {
                salonId,
            },
            orderBy: {
                start: 'asc',
            },
        });
    }

    async delete(id: string, salonId: string) {
        return this.prisma.scheduleBlock.delete({
            where: {
                id,
                salonId,
            },
        });
    }
}