import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FinanceService } from './finance.service';
import { FinanceRangeDto } from './dto/finance-range.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter resumo de receitas, despesas e comissões' })
  @Get('summary')
  async getSummary(@Req() req, @Query() filters: FinanceRangeDto) {
    return this.financeService.getSummary(req.user.salonId, filters);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Listar histórico de transações financeiras' })
  @Get('transactions')
  async getTransactions(@Req() req, @Query() filters: FinanceRangeDto) {
    return this.financeService.getTransactions(req.user.salonId, filters);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Lançar uma transação manual (receita ou despesa)' })
  @Post('transactions')
  async createTransaction(@Req() req, @Body() data: CreateTransactionDto) {
    return this.financeService.createTransaction(req.user.salonId, data);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary:
      'Lançar uma despesa especificamente (Aluguel, Materiais, Salários)',
  })
  @Post('expense')
  async createExpense(@Req() req, @Body() data: CreateExpenseDto) {
    return this.financeService.createTransaction(req.user.salonId, {
      type: 'EXPENSE',
      category: data.category,
      description: data.description,
      amount: data.amount,
    });
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter fluxo de caixa diário' })
  @Get('cash-flow/daily')
  async getDailyCashFlow(@Req() req, @Query('date') date: string) {
    const targetDate = date || new Date().toISOString().substring(0, 10);
    return this.financeService.getDailyCashFlow(req.user.salonId, targetDate);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter fluxo de caixa mensal' })
  @Get('cash-flow/monthly')
  async getMonthlyCashFlow(
    @Req() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const today = new Date();
    const y = year ? parseInt(year) : today.getFullYear();
    const m = month ? parseInt(month) : today.getMonth() + 1;
    return this.financeService.getMonthlyCashFlow(req.user.salonId, y, m);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter lucro do salão' })
  @Get('profit')
  async getProfit(@Req() req, @Query() filters: FinanceRangeDto) {
    return this.financeService.getProfit(req.user.salonId, filters);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter despesas detalhadas' })
  @Get('expenses')
  async getExpenses(@Req() req, @Query() filters: FinanceRangeDto) {
    return this.financeService.getExpenses(req.user.salonId, filters);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter relatório financeiro mensal completo' })
  @Get('report/monthly')
  async getMonthlyReport(
    @Req() req,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const today = new Date();
    const y = year ? parseInt(year) : today.getFullYear();
    const m = month ? parseInt(month) : today.getMonth() + 1;
    return this.financeService.getMonthlyReport(
      req.user.salonId,
      y,
      m,
      startDate,
      endDate,
    );
  }
  
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter relatório detalhado de atendimentos' })
  @Get('report/appointments')
  async getAppointmentsReport(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getAppointmentsReport(req.user.salonId, startDate, endDate);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter relatório resumido de colaboradores' })
  @Get('report/collaborators')
  async getCollaboratorsReport(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getCollaboratorsReport(req.user.salonId, startDate, endDate);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter detalhes de relatório de um colaborador específico' })
  @Get('report/collaborators/:id')
  async getCollaboratorDetailsReport(
    @Req() req,
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getCollaboratorDetailsReport(req.user.salonId, id, startDate, endDate);
  }
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Realizar sangria (retirada manual de caixa)' })
  @Post('withdraw')
  async withdraw(
    @Req() req,
    @Body() data: { amount: number; description: string },
  ) {
    return this.financeService.createWithdrawal(
      req.user.salonId,
      data.amount,
      data.description,
    );
  }
}
