import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CashFlowRepository } from './cash-flow.repository';
import { CashFlowService } from './cash-flow.service';

@Module({
    imports: [PrismaModule],
    controllers: [FinanceController],
    providers: [FinanceService, CashFlowRepository, CashFlowService],
    exports: [CashFlowService],
})
export class FinanceModule { }