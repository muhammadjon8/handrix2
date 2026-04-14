import { Module } from '@nestjs/common';
import { JobCategoriesController } from './job-categories.controller';
import { JobCategoriesService } from './job-categories.service';

@Module({
  controllers: [JobCategoriesController],
  providers: [JobCategoriesService],
})
export class JobCategoriesModule {}
