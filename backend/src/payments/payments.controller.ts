import { Controller, Post, Body, Get, Query, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private paymentsService: PaymentsService) { }

    @Post()
    create(@Body() data: CreatePaymentDto, @Req() req) {
        return this.paymentsService.create(req.user.salonId, data);
    }

    @Get()
    findAll(@Req() req) {
        return this.paymentsService.findAll(req.user.salonId);
    }

    @Get('cashflow')
    getCashflow(@Query('date') date: string, @Req() req) {
        return this.paymentsService.getCashflow(req.user.salonId, date);
    }
}