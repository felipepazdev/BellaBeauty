import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ScheduleBlocksService } from './schedule-blocks.service';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';

@Controller('schedule-blocks')
export class ScheduleBlocksController {
  constructor(private service: ScheduleBlocksService) {}

  @Post()
  create(@Body() dto: CreateScheduleBlockDto, @Req() req) {
    return this.service.create(dto, req.user.salonId);
  }

  @Get()
  findAll(@Req() req) {
    return this.service.findAll(req.user.salonId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.service.delete(id, req.user.salonId);
  }
}
