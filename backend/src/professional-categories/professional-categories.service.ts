import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfessionalCategoriesService {
    constructor(private prisma: PrismaService) {}

    async findAll(salonId: string) {
        return this.prisma.serviceCategory.findMany({
            where: { salonId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async create(salonId: string, data: { name: string }) {
        return this.prisma.serviceCategory.create({
            data: {
                name: data.name,
                salonId,
            },
        });
    }

    async update(id: string, salonId: string, data: { name: string }) {
        const category = await this.prisma.serviceCategory.findFirst({ where: { id, salonId } });
        if (!category) throw new NotFoundException('Categoria não encontrada');

        return this.prisma.serviceCategory.update({
            where: { id },
            data: { name: data.name },
        });
    }

    async remove(id: string, salonId: string) {
        const category = await this.prisma.serviceCategory.findFirst({ where: { id, salonId } });
        if (!category) throw new NotFoundException('Categoria não encontrada');

        // Verify if there are any professionals attached (many-to-many relationship)
        const professionalsCount = await this.prisma.professional.count({ 
            where: { 
                categories: { some: { id } } 
            } 
        });
        
        // Also verify services linked directly to the category
        const servicesCount = await this.prisma.service.count({ 
            where: { categoryId: id } 
        });

        if (professionalsCount > 0 || servicesCount > 0) {
            throw new ForbiddenException('Não é possível excluir uma categoria que possui profissionais ou serviços vinculados.');
        }

        return this.prisma.serviceCategory.delete({
            where: { id },
        });
    }
}
