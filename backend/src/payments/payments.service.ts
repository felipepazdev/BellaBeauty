import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(salonId: string, data: CreatePaymentDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: data.appointmentId,
        salonId,
      },
      include: {
        service: true,
        professional: true,
        client: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const commissionValue =
      (data.amount * appointment.professional.commission) / 100;

    const [payment, transaction] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          appointmentId: data.appointmentId,
          salonId,
        },
      }),

      this.prisma.commission.create({
        data: {
          amount: commissionValue,
          professionalId: appointment.professionalId,
          appointmentId: appointment.id,
        },
      }),
    ]);

    // Create the financial transaction linking to the payment
    await this.prisma.financialTransaction.create({
      data: {
        salonId,
        type: 'ENTRADA',
        category: 'COMANDA',
        amount: data.amount,
        method: data.method,
        description: `Pagamento de agendamento: ${appointment.service.name} (${appointment.client?.name || 'Cliente'})`,
        referenceId: appointment.id,
        referenceType: 'appointment',
        paymentId: payment.id,
      },
    });

    return payment;
  }

  async findAll(salonId: string) {
    return this.prisma.payment.findMany({
      where: { salonId },
      include: {
        appointment: {
          include: {
            client: true,
            professional: true,
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCashflow(salonId: string, date: string) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const payments = await this.prisma.payment.findMany({
      where: {
        salonId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      total,
      transactions: payments,
    };
  }
}
