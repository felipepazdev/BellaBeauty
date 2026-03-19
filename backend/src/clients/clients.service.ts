import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateClientDto, salonId: string) {
    return this.prisma.client.create({
      data: {
        salonId,
        name: data.name,
        phone: data.phone,
      },
    });
  }

  async findAll(salonId: string) {
    const clients = await this.prisma.client.findMany({
      where: { salonId },
      include: {
        appointments: {
          include: {
            payment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clients.map((c) => {
      const totalSpent = c.appointments.reduce(
        (sum, a) => sum + (a.payment?.amount ?? 0),
        0,
      );

      const lastVisit =
        c.appointments.length > 0
          ? c.appointments.sort(
              (a, b) => b.date.getTime() - a.date.getTime(),
            )[0].date
          : null;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalAppointments: c.appointments.length,
        totalSpent,
        lastVisit,
      };
    });
  }

  async findOne(id: string, salonId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        salonId,
      },
      include: {
        appointments: {
          include: {
            service: true,
            payment: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(id: string, salonId: string, data: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        salonId,
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, salonId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        salonId,
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.client.delete({
      where: { id },
    });
  }
}
