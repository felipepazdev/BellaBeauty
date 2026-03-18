import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';

@Injectable()
export class AdvancesService {
  constructor(private prisma: PrismaService) {}

  async create(salonId: string, dto: CreateAdvanceDto) {
    return this.prisma.professionalAdvance.create({
      data: {
        description: dto.description,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : new Date(),
        professionalId: dto.professionalId,
        salonId,
      },
    });
  }

  async findAll(salonId: string, professionalId?: string) {
    return this.prisma.professionalAdvance.findMany({
      where: {
        salonId,
        professionalId: professionalId || undefined,
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        professional: true,
      },
    });
  }

  async remove(salonId: string, id: string) {
    return this.prisma.professionalAdvance.delete({
      where: {
        id,
        salonId,
      },
    });
  }
}
