import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Query,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Permissions('appointments_manage')
  @Post()
  create(@Body() data: CreateAppointmentDto, @Req() req) {
    return this.appointmentsService.create(data, req.user.salonId, req.user);
  }

  @Permissions('appointments_manage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateAppointmentDto,
    @Req() req,
  ) {
    return this.appointmentsService.update(
      id,
      data,
      req.user.salonId,
      req.user,
    );
  }

  @Permissions('appointments_view')
  @Get('day')
  findByDay(@Query('date') date: string, @Req() req) {
    return this.appointmentsService.findByDay(
      date,
      req.user.salonId,
      req.user.role,
      req.user.professionalId,
    );
  }

  @Get('timeline/day')
  timelineDay(@Query('date') date: string, @Req() req) {
    return this.appointmentsService.getTimelineDay(
      date,
      req.user.salonId,
      req.user.role,
      req.user.professionalId,
    );
  }

  @Get('timeline/week')
  timelineWeek(@Query('date') date: string, @Req() req) {
    return this.appointmentsService.getTimelineWeek(
      date,
      req.user.salonId,
      req.user.role,
      req.user.professionalId,
    );
  }

  @Patch('reschedule')
  reschedule(@Body() data: RescheduleAppointmentDto, @Req() req) {
    return this.appointmentsService.reschedule(
      data.appointmentId,
      data.newDate,
      data.professionalId,
      req.user.salonId,
      req.user,
    );
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
    @Req() req,
  ) {
    return this.appointmentsService.cancel(id, req.user.salonId, dto);
  }

  @Patch(':id/check-in')
  checkIn(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.checkIn(id, req.user.salonId);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.complete(id, req.user.salonId);
  }

  @Patch(':id/no-show')
  noShow(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.noShow(id, req.user.salonId);
  }

  @Get('professional/:id')
  findByProfessional(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.findByProfessional(req.user.salonId, id);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('professionalId') professionalId: string,
    @Query('serviceId') serviceId: string,
    @Query('date') date: string,
    @Req() req,
  ) {
    return this.appointmentsService.getAvailableSlots(
      professionalId,
      serviceId,
      date,
      req.user.salonId,
      req.user,
    );
  }
}
