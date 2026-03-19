import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Listar todas as despesas' })
  @Get()
  async findAll(@Req() req, @Query() filters: any) {
    return this.expensesService.findAll(req.user.salonId, filters);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Obter detalhe de uma despesa' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Criar uma nova despesa' })
  @Post()
  async create(@Req() req, @Body() data: CreateExpenseDto) {
    return this.expensesService.createExpense(req.user.salonId, data);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Atualizar uma despesa' })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateExpenseDto) {
    return this.expensesService.updateExpense(id, data);
  }

  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Excluir uma despesa' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.expensesService.deleteExpense(id);
  }
}
