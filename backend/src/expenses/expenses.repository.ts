import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, trx?: Prisma.TransactionClient) {
    const client = trx || this.prisma;
    return client.expense.findUnique({
      where: { id },
    });
  }

  async findAll(salonId: string, filters?: any) {
    const where: any = { salonId };

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;

    return this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async create(
    data: Prisma.ExpenseUncheckedCreateInput,
    trx?: Prisma.TransactionClient,
  ) {
    const client = trx || this.prisma;
    return client.expense.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.ExpenseUpdateInput,
    trx?: Prisma.TransactionClient,
  ) {
    const client = trx || this.prisma;
    return client.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, trx?: Prisma.TransactionClient) {
    const client = trx || this.prisma;
    return client.expense.delete({
      where: { id },
    });
  }
}
