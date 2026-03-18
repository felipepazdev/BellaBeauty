import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { CommissionsModule } from './commissions/commissions.module';
import { ScheduleBlocksModule } from './schedule-blocks/schedule-blocks.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { ClientsModule } from './clients/clients.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ServicesModule } from './services/services.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { ProfessionalCategoriesModule } from './professional-categories/professional-categories.module';
import { AdvancesModule } from './advances/advances.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    ScheduleModule.forRoot(),

    PrismaModule,
    AuthModule,
    UsersModule,

    AppointmentsModule,
    PaymentsModule,
    CommissionsModule,
    ScheduleBlocksModule,

    DashboardModule,
    ClientsModule,
    FinanceModule,
    InventoryModule,
    OrdersModule,
    NotificationsModule,
    ServicesModule,
    ServiceCategoriesModule,
    ProfessionalCategoriesModule,
    AdvancesModule,
    ExpensesModule,
  ],
})
export class AppModule { }