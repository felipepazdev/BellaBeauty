import { Controller, Get, Body, Patch, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Get()
  getSettings(@Req() req: any) {
    const salonId = req.user.salonId;
    return this.settingsService.getSalonSettings(salonId);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch()
  updateSettings(@Req() req: any, @Body() updateSettingDto: UpdateSettingDto) {
    const salonId = req.user.salonId;
    return this.settingsService.updateSalonSettings(salonId, updateSettingDto);
  }
}
