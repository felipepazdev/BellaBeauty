import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSalonSettings(salonId: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    return {
      plan: salon.plan,
      billingCycle: salon.billingCycle,
      whatsappProvider: salon.whatsappProvider,
      whatsappToken: salon.whatsappToken,
      whatsappPhoneId: salon.whatsappPhoneId,
      whatsappTemplate24h: salon.whatsappTemplate24h,
      whatsappTemplate2h: salon.whatsappTemplate2h,
    };
  }

  async updateSalonSettings(salonId: string, dto: UpdateSettingDto) {
    const salon = await this.prisma.salon.update({
      where: { id: salonId },
      data: dto,
    });

    return {
      message: 'Settings updated successfully',
      settings: {
        plan: salon.plan,
        billingCycle: salon.billingCycle,
        whatsappProvider: salon.whatsappProvider,
        whatsappToken: salon.whatsappToken,
        whatsappPhoneId: salon.whatsappPhoneId,
        whatsappTemplate24h: salon.whatsappTemplate24h,
        whatsappTemplate2h: salon.whatsappTemplate2h,
      },
    };
  }

  async updatePlan(salonId: string, plan: string, billingCycle: string) {
    const salon = await this.prisma.salon.update({
      where: { id: salonId },
      data: { plan, billingCycle },
    });
    return {
      message: 'Plan updated successfully',
      plan: salon.plan,
      billingCycle: salon.billingCycle,
    };
  }
}

