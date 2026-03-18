import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockMovementDto } from './dto/stock-movement.dto';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) {}

    async createProduct(salonId: string, data: CreateProductDto) {
        return this.prisma.product.create({
            data: {
                ...data,
                salonId,
            },
        });
    }

    async getProducts(salonId: string) {
        return this.prisma.product.findMany({
            where: { salonId },
            orderBy: { name: 'asc' },
        });
    }

    async getProductStats(salonId: string) {
        const products = await this.prisma.product.findMany({
            where: { salonId },
        });

        const lowStock = products.filter(p => p.stock <= p.minStock);
        const totalValue = products.reduce((acc, p) => acc + (p.costPrice || 0) * p.stock, 0);

        return {
            totalProducts: products.length,
            lowStockCount: lowStock.length,
            lowStockProducts: lowStock,
            totalStockValue: totalValue, // Quanto de $$ está parado no estoque
        };
    }

    async getProduct(salonId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, salonId },
            include: {
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }

        return product;
    }

    async updateProduct(salonId: string, id: string, data: UpdateProductDto) {
        const product = await this.prisma.product.findFirst({
            where: { id, salonId },
        });

        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }

        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async deleteProduct(salonId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, salonId },
        });

        if (!product) {
            throw new NotFoundException('Produto não encontrado');
        }

        // Deleta também as movimentações por causa da foreign key
        await this.prisma.stockMovement.deleteMany({
            where: { productId: id }
        });

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async addStockMovement(salonId: string, productId: string, data: StockMovementDto) {
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({
                where: { id: productId, salonId },
            });

            if (!product) {
                throw new NotFoundException('Produto não encontrado');
            }

            const newStock = data.type === 'IN' 
                ? product.stock + data.quantity 
                : product.stock - data.quantity;

            if (data.type === 'OUT' && newStock < 0) {
                throw new BadRequestException('Quantidade de estoque insuficiente');
            }

            const movement = await tx.stockMovement.create({
                data: {
                    salonId,
                    productId,
                    type: data.type,
                    quantity: data.quantity,
                    reason: data.reason || (data.type === 'IN' ? 'ADJUSTMENT' : 'LOSS'),
                },
            });

            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: { stock: newStock },
            });

            return { movement, product: updatedProduct };
        });
    }
}
