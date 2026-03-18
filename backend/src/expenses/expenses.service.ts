import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesRepository } from './expenses.repository';
import { CashFlowService } from '../finance/cash-flow.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
    constructor(
        private prisma: PrismaService,
        private expensesRepository: ExpensesRepository,
        private cashFlowService: CashFlowService
    ) { }

    async createExpense(salonId: string, data: CreateExpenseDto) {
        console.log("📝 [ExpensesService] Iniciando criação de despesa:", data);
        return await this.prisma.$transaction(async (trx: any) => {
            const expense = await this.expensesRepository.create({
                salonId,
                description: data.description,
                value: data.value,
                date: data.date ? new Date(data.date) : new Date(),
                category: data.category,
                status: 'PAID'
            }, trx);

            console.log("📌 [ExpensesService] Despesa persistida:", expense.id);
            console.log("🔗 [ExpensesService] Sincronizando com Fluxo de Caixa...");
            
            await this.cashFlowService.createFromExpense(expense, trx);

            return expense;
        });
    }

    async updateExpense(id: string, data: UpdateExpenseDto) {
        return await this.prisma.$transaction(async (trx: any) => {
            const existing = await this.expensesRepository.findById(id, trx);
            if (!existing) throw new NotFoundException('Despesa não encontrada');

            const updated = await this.expensesRepository.update(id, {
                description: data.description,
                value: data.value,
                date: data.date ? new Date(data.date) : undefined,
                category: data.category,
                status: data.status
            }, trx);

            await this.cashFlowService.updateFromExpense(updated, trx);

            return updated;
        });
    }

    async deleteExpense(id: string) {
        console.log("🗑️ [ExpensesService] Excluindo despesa:", id);
        return await this.prisma.$transaction(async (trx: any) => {
            const existing = await this.expensesRepository.findById(id, trx);
            if (!existing) throw new NotFoundException('Despesa não encontrada');

            await this.expensesRepository.delete(id, trx);
            
            console.log("🔗 [ExpensesService] Removendo vínculo no Fluxo de Caixa...");
            await this.cashFlowService.deleteByReference(id, 'expense', trx);
            
            return { success: true };
        });
    }

    async findAll(salonId: string, filters?: any) {
        return this.expensesRepository.findAll(salonId, filters);
    }

    async findOne(id: string) {
        const expense = await this.expensesRepository.findById(id);
        if (!expense) throw new NotFoundException('Despesa não encontrada');
        return expense;
    }
}
