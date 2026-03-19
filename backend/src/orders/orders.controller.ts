import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddProductOrderDto } from './dto/add-product-order.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders (Comandas)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Abre uma comanda para o cliente' })
  @Post()
  async create(@Req() req, @Body() data: CreateOrderDto) {
    return this.ordersService.create(req.user.salonId, data);
  }

  @ApiOperation({ summary: 'Atualizar metadados da comanda' })
  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() data: UpdateOrderDto,
  ) {
    return this.ordersService.update(req.user.salonId, id, data);
  }

  @ApiOperation({ summary: 'Listar todas as comandas (abertas e fechadas)' })
  @Get()
  async findAll(@Req() req) {
    return this.ordersService.findAll(req.user.salonId);
  }

  @ApiOperation({ summary: 'Listar todas comandas abertas' })
  @Get('open')
  async getOpenOrders(@Req() req) {
    return this.ordersService.getOpenOrders(req.user.salonId);
  }

  @ApiOperation({ summary: 'Ver detalhes de uma comanda específica' })
  @Get(':id')
  async getOrderById(@Req() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.salonId, id);
  }

  @ApiOperation({ summary: 'Vincular agendamento na comanda' })
  @Patch(':id/appointments/:appointmentId')
  async attachAppointment(
    @Req() req,
    @Param('id') orderId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.ordersService.attachAppointment(
      req.user.salonId,
      orderId,
      appointmentId,
    );
  }

  @ApiOperation({ summary: 'Adicionar produto avulso à comanda' })
  @Post(':id/products')
  async addProduct(
    @Req() req,
    @Param('id') orderId: string,
    @Body() data: AddProductOrderDto,
  ) {
    return this.ordersService.addProduct(req.user.salonId, orderId, data);
  }

  @ApiOperation({ summary: 'Finalizar comanda e gerar cobrança' })
  @Post(':id/checkout')
  async checkout(
    @Req() req,
    @Param('id') orderId: string,
    @Body() data: CheckoutOrderDto,
  ) {
    return this.ordersService.checkout(req.user.salonId, orderId, data);
  }

  @ApiOperation({ summary: 'Remover agendamento da comanda' })
  @Patch(':id/appointments/:appointmentId/remove')
  async removeAppointment(
    @Req() req,
    @Param('id') orderId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.ordersService.removeAppointment(
      req.user.salonId,
      orderId,
      appointmentId,
    );
  }

  @ApiOperation({ summary: 'Remover produto da comanda' })
  @Patch(':id/products/:orderProductId/remove')
  async removeProduct(
    @Req() req,
    @Param('id') orderId: string,
    @Param('orderProductId') orderProductId: string,
  ) {
    return this.ordersService.removeProduct(
      req.user.salonId,
      orderId,
      orderProductId,
    );
  }
}
