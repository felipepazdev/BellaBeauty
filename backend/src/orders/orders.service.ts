import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddProductOrderDto } from './dto/add-product-order.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) {}

    async update(salonId: string, id: string, data: UpdateOrderDto) {
        const order = await this.prisma.order.findFirst({ where: { id, salonId } });
        if (!order) throw new NotFoundException('Comanda não encontrada');
        if (order.status === 'CLOSED') throw new BadRequestException('Não é possível editar uma comanda fechada');

        return this.prisma.order.update({
            where: { id },
            data: {
                clientId: data.clientId,
                status: data.status,
                createdAt: data.date ? new Date(data.date) : undefined
            }
        });
    }

    async create(salonId: string, data: CreateOrderDto) {
        // Verifica se já tem comanda aberta para esse cliente
        const openOrder = await this.prisma.order.findFirst({
            where: { salonId, clientId: data.clientId, status: 'OPEN' }
        });

        if (openOrder) {
            return openOrder; // Se já tem, devolve a mesma
        }

        return this.prisma.order.create({
            data: {
                salonId,
                clientId: data.clientId,
                status: 'OPEN',
            }
        });
    }

    async getOpenOrders(salonId: string) {
        return this.prisma.order.findMany({
            where: { salonId, status: 'OPEN' },
            include: {
                client: true,
                appointments: {
                    include: { service: true, professional: true }
                },
                products: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findAll(salonId: string) {
        return this.prisma.order.findMany({
            where: { salonId },
            include: {
                client: true,
                appointments: {
                    include: { service: true, professional: true }
                },
                products: {
                    include: { product: true }
                },
                payments: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getOrderById(salonId: string, id: string) {
        const order = await this.prisma.order.findFirst({
            where: { id, salonId },
            include: {
                client: true,
                appointments: {
                    include: { service: true, professional: true }
                },
                products: {
                    include: { product: true }
                },
                payments: true
            }
        });

        if (!order) throw new NotFoundException('Comanda não encontrada');
        return order;
    }

    // Vincular um agendamento já finalizado na comanda
    async attachAppointment(salonId: string, orderId: string, appointmentId: string) {
        const order = await this.prisma.order.findFirst({ where: { id: orderId, salonId } });
        if (!order || order.status === 'CLOSED') throw new BadRequestException('Comanda fechada ou inválida');

        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, salonId }
        });

        if (!appointment) throw new NotFoundException('Agendamento não encontrado');

        return this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { orderId }
        });
    }

    async removeAppointment(salonId: string, orderId: string, appointmentId: string) {
        const order = await this.prisma.order.findFirst({ where: { id: orderId, salonId }, include: { payments: true } });
        if (!order || order.status === 'CLOSED') throw new BadRequestException('Comanda fechada ou inválida');
        if (order.payments.length > 0) throw new BadRequestException('Não é possível remover itens de uma comanda que já possui pagamentos');

        return this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { orderId: null }
        });
    }

    async removeProduct(salonId: string, orderId: string, orderProductId: string) {
        const order = await this.prisma.order.findFirst({ where: { id: orderId, salonId }, include: { payments: true } });
        if (!order || order.status === 'CLOSED') throw new BadRequestException('Comanda fechada ou inválida');
        if (order.payments.length > 0) throw new BadRequestException('Não é possível remover itens de uma comanda que já possui pagamentos');

        return this.prisma.$transaction(async (tx) => {
            const op = await tx.orderProduct.findUnique({ where: { id: orderProductId } });
            if (!op) throw new NotFoundException('Item não encontrado');

            // Devolve estoque
            await tx.product.update({
                where: { id: op.productId },
                data: { stock: { increment: op.quantity } }
            });

            await tx.stockMovement.create({
                data: {
                    salonId,
                    productId: op.productId,
                    type: 'IN',
                    quantity: op.quantity,
                    reason: 'ADJUSTMENT',
                }
            });

            return tx.orderProduct.delete({ where: { id: orderProductId } });
        });
    }

    // Adicionar um Produto avulso (Baixa no estoque)
    async addProduct(salonId: string, orderId: string, data: AddProductOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({ where: { id: orderId, salonId } });
            if (!order || order.status !== 'OPEN') throw new BadRequestException('Comanda fechada ou inválida');

            const product = await tx.product.findFirst({ where: { id: data.productId, salonId }});
            if (!product) throw new NotFoundException('Produto não encontrado');

            if (product.stock < data.quantity) throw new BadRequestException('Estoque insuficiente');

            // 1) Criar item na comanda
            const orderProduct = await tx.orderProduct.create({
                data: {
                    orderId,
                    productId: product.id,
                    quantity: data.quantity,
                    unitPrice: product.price
                }
            });

            // 2) Dar baixa no estoque e registrar movimento
            await tx.product.update({
                where: { id: product.id },
                data: { stock: product.stock - data.quantity }
            });

            await tx.stockMovement.create({
                data: {
                    salonId,
                    productId: product.id,
                    type: 'OUT',
                    quantity: data.quantity,
                    reason: 'SALE'
                }
            });

            return orderProduct;
        });
    }

    // Calcular Totais e Registrar Pagamentos / Fechar
    async checkout(salonId: string, orderId: string, data: CheckoutOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
                where: { id: orderId, salonId },
                include: { 
                    appointments: { include: { service: true }}, 
                    products: true,
                    payments: true
                }
            });

            if (!order || order.status === 'CLOSED') {
                throw new BadRequestException('Comanda inválida ou já fechada');
            }

            let subtotal = 0;
            order.appointments.forEach(app => subtotal += app.service.price);
            order.products.forEach(p => subtotal += (p.unitPrice * p.quantity));

            // Aplica desconto (persistindo na comanda se enviado agora)
            let currentDiscount = order.discount;
            if (data.discount !== undefined) {
                if (data.discountType === 'PERCENTAGE') {
                    currentDiscount = subtotal * (data.discount / 100);
                } else {
                    currentDiscount = data.discount;
                }
            }

            const totalAmount = subtotal - currentDiscount;
            const alreadyPaidBefore = order.payments.reduce((acc, p) => acc + p.amount, 0);

            // Novos pagamentos
            const newPayments = data.payments || [];
            const totalToPayNow = newPayments.reduce((acc, p) => acc + p.amount, 0);

            if (alreadyPaidBefore + totalToPayNow > totalAmount + 0.01) {
                throw new BadRequestException(`Pagamento excede o total da comanda (Faltava R$ ${(totalAmount - alreadyPaidBefore).toFixed(2)})`);
            }

            // 1) Registrar novos pagamentos e gerar Entrada no Fluxo de Caixa
            for (const p of newPayments) {
                await tx.payment.create({
                    data: {
                        salonId,
                        orderId,
                        method: p.method,
                        amount: p.amount,
                        financialTransactions: {
                            create: {
                                salonId,
                                type: 'ENTRADA',
                                category: 'COMANDA',
                                amount: p.amount,
                                method: p.method,
                                referenceId: orderId,
                                description: `Pagamento Comanda #${orderId.slice(0,6)} (${p.method})`
                            }
                        }
                    }
                });
            }

            const totalPaidNow = alreadyPaidBefore + totalToPayNow;
            const isFullyPaid = totalPaidNow >= (totalAmount - 0.01);
            const newStatus = isFullyPaid ? 'CLOSED' : 'OPEN';

            // 2) Atualizar comanda (Status e total pago)
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    totalAmount,
                    totalPaid: totalPaidNow,
                    discount: currentDiscount,
                }
            });

            // 3) Se fechou totalmente, processa agendamentos e comissões
            if (isFullyPaid) {
                await tx.appointment.updateMany({
                    where: { orderId: orderId },
                    data: { status: 'COMPLETED' }
                });

                for (const app of order.appointments) {
                    const professional = await tx.professional.findUnique({ where: { id: app.professionalId }});
                    if (professional) {
                        const profAmount = professional.contractType === 'RENT' 
                                         ? app.service.price 
                                         : app.service.price * (professional.commission / 100);

                        // Evitar comissões duplicadas
                        const existingCommission = await tx.commission.findUnique({ where: { appointmentId: app.id }});
                        if (!existingCommission) {
                            await tx.commission.create({
                                data: {
                                    amount: profAmount,
                                    status: 'PENDING',
                                    professionalId: professional.id,
                                    appointmentId: app.id,
                                }
                            });
                        }
                    }
                }
            }

            return updatedOrder;
        });
    }
}
