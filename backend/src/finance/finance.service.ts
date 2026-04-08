import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceRangeDto } from './dto/finance-range.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getSummary(salonId: string, filters: FinanceRangeDto) {
    const where: any = { salonId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where,
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      // Suporta tipos legados e novos para cálculo correto
      const type = tx.type.toLowerCase();
      if (type === 'income' || type === 'entrada' || type === 'receita') {
        totalIncome += tx.amount;
      } else if (type === 'expense' || type === 'saida' || type === 'despesa') {
        totalExpense += tx.amount;
      }
    });

    const whereCommissions: any = { professional: { salonId } };
    if (filters.startDate || filters.endDate) {
      whereCommissions.createdAt = { ...where.createdAt };
    }

    const commissions = await this.prisma.commission.findMany({
      where: whereCommissions,
    });

    const pendingCommissions = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((acc, c) => acc + c.amount, 0);

    const paidCommissions = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((acc, c) => acc + c.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      pendingCommissions,
      paidCommissions,
      transactionCount: transactions.length,
    };
  }

  async getTransactions(salonId: string, filters: FinanceRangeDto) {
    const where: any = { salonId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.type) {
      const t = filters.type.toLowerCase();
      if (t === 'entrada' || t === 'income' || t === 'receita') {
        where.type = { in: ['ENTRADA', 'INCOME', 'receita'] };
      } else if (t === 'saida' || t === 'expense' || t === 'despesa') {
        where.type = { in: ['SAIDA', 'EXPENSE', 'despesa'] };
      }
    }

    if (filters.category) where.category = filters.category;
    if (filters.method) where.method = filters.method;

    return this.prisma.financialTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        payment: {
          include: {
            order: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });
  }

  async createTransaction(salonId: string, data: CreateTransactionDto) {
    return this.prisma.financialTransaction.create({
      data: {
        salonId,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        method: (data as any).method || 'OTHER',
        referenceId: (data as any).referenceId || '',
      },
    });
  }

  async createWithdrawal(salonId: string, amount: number, reason: string) {
    const summary = await this.getSummary(salonId, {});
    if (summary.netBalance < amount) {
      throw new BadRequestException('Saldo insuficiente para retirar');
    }

    return this.prisma.financialTransaction.create({
      data: {
        salonId,
        type: 'SAIDA',
        category: 'SANGRIA',
        amount: amount,
        description: reason || 'Sangria de caixa',
        method: 'CASH',
      },
    });
  }

  // 1) Fluxo de caixa diário
  async getDailyCashFlow(salonId: string, date: string) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        salonId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`🔍 [FinanceService] Buscando fluxo diário para ${date}`);
    const incomes = transactions.filter((t) => {
      const type = t.type.toLowerCase();
      return type === 'income' || type === 'entrada' || type === 'receita';
    });
    const expenses = transactions.filter((t) => {
      const type = t.type.toLowerCase();
      return type === 'expense' || type === 'saida' || type === 'despesa';
    });

    const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

    return {
      date,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactions,
    };
  }

  // 2) Fluxo de caixa mensal
  async getMonthlyCashFlow(salonId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        salonId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'asc' },
    });

    const days = new Map<
      string,
      { income: number; expense: number; balance: number }
    >();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const dayStr = tx.createdAt.toISOString().substring(0, 10);
      if (!days.has(dayStr)) {
        days.set(dayStr, { income: 0, expense: 0, balance: 0 });
      }

      const dayData = days.get(dayStr)!;

      const type = tx.type.toLowerCase();
      if (type === 'income' || type === 'entrada' || type === 'receita') {
        dayData.income += tx.amount;
        totalIncome += tx.amount;
      } else if (type === 'expense' || type === 'saida' || type === 'despesa') {
        dayData.expense += tx.amount;
        totalExpense += tx.amount;
      }
      dayData.balance = dayData.income - dayData.expense;
    });

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      dailyBreakdown: Array.from(days.entries()).map(([date, data]) => ({
        date,
        ...data,
      })),
    };
  }

  // 3) Lucro do salão
  async getProfit(salonId: string, filters: FinanceRangeDto) {
    const where: any = { salonId };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where,
    });

    const totalIncome = transactions
      .filter((t) => {
        const type = t.type.toLowerCase();
        return type === 'income' || type === 'entrada' || type === 'receita';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => {
        const type = t.type.toLowerCase();
        return type === 'expense' || type === 'saida' || type === 'despesa';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const commissionsWhere: any = { professional: { salonId }, status: 'PAID' };
    if (filters.startDate || filters.endDate) {
      commissionsWhere.createdAt = { ...where.createdAt };
    }

    const paidCommissions = await this.prisma.commission.findMany({
      where: commissionsWhere,
    });

    const totalCommissionsPaid = paidCommissions.reduce(
      (acc, c) => acc + c.amount,
      0,
    );

    const realProfit = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      totalCommissionsPaid,
      realProfit,
      profitMarginPercent:
        totalIncome > 0 ? (realProfit / totalIncome) * 100 : 0,
    };
  }

  async getExpenses(salonId: string, filters: FinanceRangeDto) {
    const where: any = {
      salonId,
      type: { in: ['EXPENSE', 'SAIDA', 'despesa'] },
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const expenses = await this.prisma.financialTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const groupedByCategory = expenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    return {
      totalExpense,
      groupedByCategory,
      expenses,
    };
  }

  // 5) Relatório Financeiro Mensal (ou Periódico)
  async getMonthlyReport(
    salonId: string,
    year: number,
    month: number,
    startDate?: string,
    endDate?: string,
  ) {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00`);
      end = new Date(`${endDate}T23:59:59`);
    } else {
      start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      end = new Date(year, month, 0, 23, 59, 59, 999);
    }

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const filters = {
      startDate: startIso,
      endDate: endIso,
    };

    // Calculate daily cash flow for the range
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        salonId,
        createdAt: { gte: start, lte: end },
      },
      orderBy: { createdAt: 'asc' },
    });

    const days = new Map<
      string,
      { income: number; expense: number; balance: number }
    >();

    transactions.forEach((tx) => {
      const dayStr = tx.createdAt.toISOString().substring(0, 10);
      if (!days.has(dayStr)) {
        days.set(dayStr, { income: 0, expense: 0, balance: 0 });
      }
      const dayData = days.get(dayStr)!;
      const type = tx.type.toLowerCase();
      if (type === 'income' || type === 'entrada' || type === 'receita') {
        dayData.income += tx.amount;
      } else if (type === 'expense' || type === 'saida' || type === 'despesa') {
        dayData.expense += tx.amount;
      }
      dayData.balance = dayData.income - dayData.expense;
    });

    const dailyCashFlow = Array.from(days.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    const profit = await this.getProfit(salonId, filters);
    const expenses = await this.getExpenses(salonId, filters);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId,
        status: 'COMPLETED',
        date: { gte: start, lte: end },
      },
      include: { service: true },
    });

    const servicesStats = appointments.reduce(
      (acc, app) => {
        const name = app.service.name;
        if (!acc[name]) acc[name] = { count: 0, revenue: 0 };
        acc[name].count += 1;
        acc[name].revenue += app.service.price;
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    return {
      period: startDate && endDate ? `${startDate} a ${endDate}` : `${year}-${month.toString().padStart(2, '0')}`,
      summary: {
        totalIncome: profit.totalIncome,
        totalExpense: profit.totalExpense,
        totalCommissionsPaid: profit.totalCommissionsPaid,
        realProfit: profit.realProfit,
        profitMarginPercent: profit.profitMarginPercent,
      },
      expensesByCategory: expenses.groupedByCategory,
      servicesStats,
      dailyCashFlow,
    };
  }

  async getAppointmentsReport(salonId: string, startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId,
        status: 'COMPLETED',
        date: { gte: start, lte: end },
      },
      include: {
        client: true,
        service: {
          include: { category: true },
        },
        order: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalRevenue = appointments.reduce((acc, app) => acc + (app.service?.price || 0), 0);
    const serviceAppointments = appointments.filter(a => a.service);
    
    const serviceStatsMap = new Map<string, { name: string; revenue: number }>();
    serviceAppointments.forEach(app => {
      const existing = serviceStatsMap.get(app.serviceId) || { name: app.service.name, revenue: 0 };
      existing.revenue += app.service.price;
      serviceStatsMap.set(app.serviceId, existing);
    });

    const topServices = Array.from(serviceStatsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      summary: {
        totalRevenue,
        count: appointments.length,
        avgService: serviceAppointments.length > 0 ? totalRevenue / serviceAppointments.length : 0,
        avgProduct: 0, // Mock
        avgPackage: 0, // Mock
      },
      topServices,
      appointments: appointments.map(app => ({
        id: app.id,
        date: app.date,
        clientName: app.client?.name || 'Cliente Local',
        category: app.service?.category?.name || 'Serviço',
        serviceName: app.service?.name || 'N/A',
        value: app.service?.price || 0,
        orderId: app.order?.id.substring(0, 5).toUpperCase() || '-',
      }))
    };
  }
  async getCollaboratorsReport(salonId: string, startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const professionals = await this.prisma.professional.findMany({
      where: { salonId, isActive: true },
      include: {
        appointments: {
          where: {
            status: 'COMPLETED',
            date: { gte: start, lte: end },
          },
          include: { service: true, commission: true },
        },
      },
    });

    return professionals.map((p) => {
      const activeDays = new Set(
        p.appointments.map((a) => a.date.toISOString().substring(0, 10))
      );
      const totalVendas = p.appointments.reduce((acc, a) => acc + (a.service?.price || 0), 0);
      const remuneracao = p.appointments.reduce((acc, a) => acc + (a.commission?.amount || 0), 0);

      return {
        id: p.id,
        name: p.name,
        daysCount: activeDays.size,
        salesCount: p.appointments.length,
        totalSales: totalVendas,
        commission: remuneracao,
      };
    });
  }

  async getCollaboratorDetailsReport(salonId: string, professionalId: string, startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const prof = await this.prisma.professional.findUnique({
      where: { id: professionalId },
    });

    if (!prof || prof.salonId !== salonId) {
      throw new Error('Profissional não encontrado');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        professionalId,
        status: 'COMPLETED',
        date: { gte: start, lte: end },
      },
      include: { service: true, commission: true },
    });

    const advances = await this.prisma.professionalAdvance.findMany({
      where: {
        professionalId,
        date: { gte: start, lte: end },
      },
    });

    const totalRevenue = appointments.reduce((acc, a) => acc + (a.service?.price || 0), 0);
    const totalCommissions = appointments.reduce((acc, a) => acc + (a.commission?.amount || 0), 0);
    const receivedCommissions = appointments
      .filter((a) => a.commission?.status === 'PAID')
      .reduce((acc, a) => acc + (a.commission?.amount || 0), 0);
    const totalAdvances = advances.reduce((acc, a) => acc + a.amount, 0);

    const activeDays = new Set(appointments.map((a) => a.date.toISOString().substring(0, 10)));

    return {
      name: prof.name,
      metrics: {
        atendimento: {
          count: appointments.length,
          total: totalRevenue,
          packageCount: 0, // Mock
        },
        productSales: {
          count: 0, // Mock
          total: 0, // Mock
        },
        packageSales: {
          count: 0, // Mock
          total: 0, // Mock
        },
        creditsSold: {
          count: 0, // Mock
          total: 0, // Mock
        },
        commissions: {
          total: totalCommissions,
          received: receivedCommissions,
        },
        tips: {
          total: 0, // Mock
          received: 0, // Mock
        },
        advances: {
          total: totalAdvances,
        },
        activeDays: activeDays.size,
        productCost: 0, // Mock
      },
    };
  }
}
