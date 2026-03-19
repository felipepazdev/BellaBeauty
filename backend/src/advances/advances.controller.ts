import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('advances')
@ApiBearerAuth()
@Controller('advances')
@UseGuards(JwtAuthGuard)
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Post()
  create(@Req() req, @Body() createAdvanceDto: CreateAdvanceDto) {
    return this.advancesService.create(req.user.salonId, createAdvanceDto);
  }

  @Get()
  findAll(@Req() req, @Query('professionalId') professionalId?: string) {
    return this.advancesService.findAll(req.user.salonId, professionalId);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.advancesService.remove(req.user.salonId, id);
  }
}
