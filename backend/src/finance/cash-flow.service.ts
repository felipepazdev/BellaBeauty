import { Injectable } from '@nestjs/common';
import { CashFlowRepository } from './cash-flow.repository';
import { Prisma, Expense } from '@prisma/client';

@Injectable()
export class CashFlowService {
  constructor(private cashFlowRepository: CashFlowRepository) {}

  async createFromExpense(expense: Expense, trx?: Prisma.TransactionClient) {
    console.log(
      '💰 [CashFlowService] Recebendo despesa para sincronização:',
      expense,
    );

    const existing = await this.cashFlowRepository.findByReference(
      expense.id,
      'expense',
      trx,
    );

    if (existing) {
      console.log(
        '⚠️ [CashFlowService] Movimentação já existe para esta despesa. Pulando.',
      );
      return;
    }

    console.log('🚀 [CashFlowService] Criando movimentação de saída...');
    return await this.cashFlowRepository.create(
      {
        salonId: expense.salonId,
        type: 'despesa',
        category: 'DESPESA',
        amount: expense.value,
        createdAt: expense.date,
        description: `Despesa: ${expense.description}`,
        referenceId: expense.id,
        referenceType: 'expense',
        method: 'OTHER',
      },
      trx,
    );
  }

  async updateFromExpense(expense: Expense, trx?: Prisma.TransactionClient) {
    console.log(
      '✏️ [CashFlowService] Atualizando movimentação da despesa:',
      expense.id,
    );
    return await this.cashFlowRepository.updateByReference(
      expense.id,
      'expense',
      {
        amount: expense.value,
        createdAt: expense.date,
        description: `Despesa: ${expense.description}`,
        category: 'DESPESA',
      },
      trx,
    );
  }

  async deleteByReference(
    referenceId: string,
    referenceType: string,
    trx?: Prisma.TransactionClient,
  ) {
    return await this.cashFlowRepository.deleteByReference(
      referenceId,
      referenceType,
      trx,
    );
  }
}
