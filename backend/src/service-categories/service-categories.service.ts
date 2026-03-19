import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceCategoriesService {
  constructor(private prisma: PrismaService) {}

  // ─── NICHOS ──────────────────────────────────────────────────────
  async findAllNiches(salonId: string) {
    return this.prisma.serviceNicho.findMany({
      where: { salonId },
      include: {
        categories: {
          include: {
            services: {
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createNiche(salonId: string, data: { name: string; order?: number }) {
    return this.prisma.serviceNicho.create({
      data: {
        name: data.name,
        order: data.order || 0,
        salonId,
      },
    });
  }

  async updateNiche(
    id: string,
    salonId: string,
    data: { name?: string; order?: number },
  ) {
    const niche = await this.prisma.serviceNicho.findFirst({
      where: { id, salonId },
    });
    if (!niche) throw new NotFoundException('Nicho não encontrado');

    return this.prisma.serviceNicho.update({
      where: { id },
      data,
    });
  }

  async removeNiche(id: string, salonId: string) {
    const niche = await this.prisma.serviceNicho.findFirst({
      where: { id, salonId },
    });
    if (!niche) throw new NotFoundException('Nicho não encontrado');

    const catCount = await this.prisma.serviceCategory.count({
      where: { nicheId: id },
    });
    if (catCount > 0) {
      throw new ForbiddenException(
        'Não é possível excluir um nicho que possui categorias vinculadas.',
      );
    }

    return this.prisma.serviceNicho.delete({
      where: { id },
    });
  }

  // ─── CATEGORIAS ──────────────────────────────────────────────────
  async findAll(salonId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { salonId },
      include: {
        niche: true,
        services: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async create(
    salonId: string,
    data: { name: string; order?: number; nicheId?: string },
  ) {
    return this.prisma.serviceCategory.create({
      data: {
        name: data.name,
        order: data.order || 0,
        nicheId: data.nicheId,
        salonId,
      },
    });
  }

  async update(
    id: string,
    salonId: string,
    data: { name?: string; order?: number; nicheId?: string },
  ) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, salonId },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    return this.prisma.serviceCategory.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, salonId: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, salonId },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    // Verify if there are any services attached
    const servicesCount = await this.prisma.service.count({
      where: { categoryId: id },
    });
    if (servicesCount > 0) {
      throw new ForbiddenException(
        'Não é possível excluir uma categoria que possui serviços vinculados.',
      );
    }

    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }
}
