import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('commissions')
export class CommissionsController {
    constructor(private commissionsService: CommissionsService) { }

    @ApiOperation({ summary: 'Listar comissões com base no cargo' })
    @Get()
    findAll(
        @Req() req,
        @Query('year') year?: string,
        @Query('month') month?: string,
        @Query('professionalId') profIdQuery?: string
    ) {
        const professionalId = req.user.role === 'PROFESSIONAL' ? req.user.professionalId : profIdQuery;
        
        return this.commissionsService.findAll(
            req.user.salonId, 
            req.user.role, 
            professionalId,
            year ? parseInt(year) : undefined,
            month ? parseInt(month) : undefined
        );
    }
}