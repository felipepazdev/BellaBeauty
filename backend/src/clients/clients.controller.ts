import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {

    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Body() data: CreateClientDto, @Req() req) {

        return this.clientsService.create(
            data,
            req.user.salonId,
        );
    }

    @Get()
    findAll(@Req() req) {

        return this.clientsService.findAll(
            req.user.salonId,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {

        return this.clientsService.findOne(
            id,
            req.user.salonId,
        );
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() data: UpdateClientDto,
        @Req() req,
    ) {

        return this.clientsService.update(
            id,
            req.user.salonId,
            data,
        );
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {

        return this.clientsService.remove(
            id,
            req.user.salonId,
        );
    }
}