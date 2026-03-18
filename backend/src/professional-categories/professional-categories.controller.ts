import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProfessionalCategoriesService } from './professional-categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('professional-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfessionalCategoriesController {
    constructor(private readonly service: ProfessionalCategoriesService) {}

    @Roles(Role.ADMIN, Role.RECEPTIONIST)
    @Get()
    findAll(@Req() req) {
        return this.service.findAll(req.user.salonId);
    }

    @Roles(Role.ADMIN, Role.RECEPTIONIST)
    @Post()
    create(@Req() req, @Body() data: { name: string }) {
        return this.service.create(req.user.salonId, data);
    }

    @Roles(Role.ADMIN, Role.RECEPTIONIST)
    @Put(':id')
    update(@Req() req, @Param('id') id: string, @Body() data: { name: string }) {
        return this.service.update(id, req.user.salonId, data);
    }

    @Roles(Role.ADMIN, Role.RECEPTIONIST)
    @Delete(':id')
    remove(@Req() req, @Param('id') id: string) {
        return this.service.remove(id, req.user.salonId);
    }
}
