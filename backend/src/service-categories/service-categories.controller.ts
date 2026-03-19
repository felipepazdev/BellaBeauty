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
import { ServiceCategoriesService } from './service-categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('service-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PROFESSIONAL)
  @Get()
  findAll(@Req() req) {
    return this.serviceCategoriesService.findAll(req.user.salonId);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PROFESSIONAL)
  @Get('niches')
  findAllNiches(@Req() req) {
    return this.serviceCategoriesService.findAllNiches(req.user.salonId);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post('niches')
  createNiche(@Req() req, @Body() data: { name: string; order?: number }) {
    return this.serviceCategoriesService.createNiche(req.user.salonId, data);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Put('niches/:id')
  updateNiche(
    @Req() req,
    @Param('id') id: string,
    @Body() data: { name?: string; order?: number },
  ) {
    return this.serviceCategoriesService.updateNiche(
      id,
      req.user.salonId,
      data,
    );
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Delete('niches/:id')
  removeNiche(@Req() req, @Param('id') id: string) {
    return this.serviceCategoriesService.removeNiche(id, req.user.salonId);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post()
  create(
    @Req() req,
    @Body() data: { name: string; order?: number; nicheId?: string },
  ) {
    return this.serviceCategoriesService.create(req.user.salonId, data);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Put(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() data: { name?: string; order?: number; nicheId?: string },
  ) {
    return this.serviceCategoriesService.update(id, req.user.salonId, data);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.serviceCategoriesService.remove(id, req.user.salonId);
  }
}
