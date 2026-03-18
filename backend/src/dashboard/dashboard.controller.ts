import {
    Controller,
    Get,
    Req,
    UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {

    constructor(
        private readonly dashboardService: DashboardService,
    ) { }

    @Get()
    getDashboard(@Req() req) {
        return this.dashboardService.getDashboard(
            req.user.salonId,
            req.user.role,
            req.user.professionalId
        );
    }
}