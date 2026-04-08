import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(salonId: string) {
    return this.prisma.service.findMany({
      where: { salonId },
      include: {
        category: {
          include: { niche: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    salonId: string,
    data: {
      name: string;
      price: number;
      costPrice?: number;
      duration: number;
      bufferTime?: number;
      categoryId: string;
    },
  ) {
    return this.prisma.service.create({
      data: {
        name: data.name,
        price: Number(data.price),
        costPrice: Number(data.costPrice || 0),
        duration: Number(data.duration),
        bufferTime: Number(data.bufferTime || 0),
        salonId,
        categoryId: data.categoryId,
      },
    });
  }

  async update(
    id: string,
    salonId: string,
    data: {
      name?: string;
      price?: number;
      costPrice?: number;
      duration?: number;
      bufferTime?: number;
      categoryId?: string;
    },
  ) {
    const updateData: any = { ...data };
    if (updateData.price !== undefined)
      updateData.price = Number(updateData.price);
    if (updateData.costPrice !== undefined)
      updateData.costPrice = Number(updateData.costPrice);
    if (updateData.duration !== undefined)
      updateData.duration = Number(updateData.duration);
    if (updateData.bufferTime !== undefined)
      updateData.bufferTime = Number(updateData.bufferTime);

    return this.prisma.service.updateMany({
      where: { id, salonId },
      data: updateData,
    });
  }

  async remove(id: string, salonId: string) {
    return this.prisma.service.deleteMany({
      where: { id, salonId },
    });
  }
}
