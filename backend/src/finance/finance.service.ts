import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceRangeDto } from './dto/finance-range.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    async getSummary(salonId: string, filters: FinanceRangeDto) {
        const where: any = { salonId };

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
        }

        const transactions = await this.prisma.financialTransaction.findMany({ where });

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

        const commissions = await this.prisma.commission.findMany({ where: whereCommissions });

        const pendingCommissions = commissions
            .filter(c => c.status === 'PENDING')
            .reduce((acc, c) => acc + c.amount, 0);

        const paidCommissions = commissions
            .filter(c => c.status === 'PAID')
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
                                client: true 
                            } 
                        } 
                    } 
                } 
            }
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
                referenceId: (data as any).referenceId || ''
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
                method: 'CASH'
            }
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
            orderBy: { createdAt: 'desc' }
        });

        console.log(`🔍 [FinanceService] Buscando fluxo diário para ${date}`);
        const incomes = transactions.filter(t => {
            const type = t.type.toLowerCase();
            return type === 'income' || type === 'entrada' || type === 'receita';
        });
        const expenses = transactions.filter(t => {
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

        const days = new Map<string, { income: number; expense: number; balance: number }>();

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
            dailyBreakdown: Array.from(days.entries()).map(([date, data]) => ({ date, ...data })),
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

        const totalCommissionsPaid = paidCommissions.reduce((acc, c) => acc + c.amount, 0);

        const realProfit = totalIncome - totalExpense - totalCommissionsPaid;

        return {
            totalIncome,
            totalExpense,
            totalCommissionsPaid,
            realProfit,
            profitMarginPercent: totalIncome > 0 ? (realProfit / totalIncome) * 100 : 0,
        };
    }

    async getExpenses(salonId: string, filters: FinanceRangeDto) {
        const where: any = { 
            salonId, 
            type: { in: ['EXPENSE', 'SAIDA', 'despesa'] } 
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

        const groupedByCategory = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);

        const totalExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

        return {
            totalExpense,
            groupedByCategory,
            expenses,
        };
    }

    // 5) Relatório Financeiro Mensal
    async getMonthlyReport(salonId: string, year: number, month: number) {
        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        const startIso = start.toISOString();
        const endIso = end.toISOString();

        const filters = {
            startDate: startIso,
            endDate: endIso,
        };

        const cashFlow = await this.getMonthlyCashFlow(salonId, year, month);
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

        const servicesStats = appointments.reduce((acc, app) => {
            const name = app.service.name;
            if (!acc[name]) acc[name] = { count: 0, revenue: 0 };
            acc[name].count += 1;
            acc[name].revenue += app.service.price;
            return acc;
        }, {} as Record<string, { count: number; revenue: number }>);

        return {
            period: `${year}-${month.toString().padStart(2, '0')}`,
            summary: {
                totalIncome: profit.totalIncome,
                totalExpense: profit.totalExpense,
                totalCommissionsPaid: profit.totalCommissionsPaid,
                realProfit: profit.realProfit,
                profitMarginPercent: profit.profitMarginPercent,
            },
            expensesByCategory: expenses.groupedByCategory,
            servicesStats,
            dailyCashFlow: cashFlow.dailyBreakdown,
        };
    }
}