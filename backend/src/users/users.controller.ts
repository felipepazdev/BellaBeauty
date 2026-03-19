import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Rota acessível a qualquer usuário autenticado (profissional pode ver lista de colegas para agendar)
  @Roles('ADMIN', 'MANAGER', 'PROFESSIONAL')
  @Get('professionals')
  findProfessionals(@Req() req) {
    return this.usersService.findProfessionals(req.user.salonId);
  }

  @Get()
  findAll(@Req() req, @Query('status') status?: 'active' | 'inactive' | 'all') {
    return this.usersService.findAll(req.user.salonId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.usersService.findOne(id, req.user.salonId);
  }

  @Post()
  create(
    @Body()
    data: {
      name: string;
      email: string;
      password: string;
      role?: string;
      nicheIds?: string[];
      serviceIds?: string[];
      commission?: number;
      contractType?: string;
      permissions?: string;
    },
    @Req() req,
  ) {
    return this.usersService.create(req.user.salonId, data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      email?: string;
      nicheIds?: string[];
      serviceIds?: string[];
      commission?: number;
      contractType?: string;
      permissions?: string;
    },
    @Req() req,
  ) {
    return this.usersService.update(id, req.user.salonId, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.usersService.delete(id, req.user.salonId);
  }

  @Get('professional/:id/working-hours')
  getWorkingHours(@Param('id') id: string) {
    return this.usersService.getWorkingHours(id);
  }

  @Put('professional/:id/working-hours')
  updateWorkingHours(
    @Param('id') id: string,
    @Req() req,
    @Body()
    schedule: { dayOfWeek: number; startTime: string; endTime: string }[],
  ) {
    return this.usersService.updateWorkingHours(id, req.user.salonId, schedule);
  }
}
