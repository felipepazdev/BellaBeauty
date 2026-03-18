import { Module } from '@nestjs/common';
import { ScheduleBlocksService } from './schedule-blocks.service';
import { ScheduleBlocksController } from './schedule-blocks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ScheduleBlocksService],
    controllers: [ScheduleBlocksController],
})
export class ScheduleBlocksModule { }