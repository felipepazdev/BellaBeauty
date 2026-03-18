import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashFlowRepository {
    constructor(private prisma: PrismaService) { }

    async findByReference(referenceId: string, referenceType: string, trx?: Prisma.TransactionClient) {
        const client = trx || this.prisma;
        return client.financialTransaction.findFirst({
            where: {
                referenceId,
                referenceType
            }
        });
    }

    async create(data: Prisma.FinancialTransactionUncheckedCreateInput, trx?: Prisma.TransactionClient) {
        const client = trx || this.prisma;
        return client.financialTransaction.create({
            data
        });
    }

    async updateByReference(referenceId: string, referenceType: string, data: Prisma.FinancialTransactionUpdateInput, trx?: Prisma.TransactionClient) {
        const client = trx || this.prisma;
        const transaction = await this.findByReference(referenceId, referenceType, client);
        
        if (!transaction) return null;

        return client.financialTransaction.update({
            where: { id: transaction.id },
            data
        });
    }

    async deleteByReference(referenceId: string, referenceType: string, trx?: Prisma.TransactionClient) {
        const client = trx || this.prisma;
        const transaction = await this.findByReference(referenceId, referenceType, client);
        
        if (!transaction) return null;

        return client.financialTransaction.delete({
            where: { id: transaction.id }
        });
    }
}
