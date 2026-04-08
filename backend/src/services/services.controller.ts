import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // Acessível a todos (Profissionais precisam ver serviços para agendar)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PROFESSIONAL)
  @Get()
  findAll(@Req() req) {
    return this.servicesService.findAll(req.user.salonId);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post()
  create(
    @Req() req,
    @Body()
    data: {
      name: string;
      price: number;
      costPrice?: number;
      duration: number;
      bufferTime?: number;
      categoryId: string;
    },
  ) {
    return this.servicesService.create(req.user.salonId, data);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Put(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      price?: number;
      costPrice?: number;
      duration?: number;
      bufferTime?: number;
      categoryId?: string;
    },
  ) {
    return this.servicesService.update(id, req.user.salonId, data);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.servicesService.remove(id, req.user.salonId);
  }
}
