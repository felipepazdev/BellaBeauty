import { Module } from '@nestjs/common';
import { ProfessionalCategoriesService } from './professional-categories.service';
import { ProfessionalCategoriesController } from './professional-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessionalCategoriesController],
  providers: [ProfessionalCategoriesService],
  exports: [ProfessionalCategoriesService],
})
export class ProfessionalCategoriesModule {}
