import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { JobCategoriesService } from './job-categories.service';

@ApiTags('job-categories')
@Controller('job-categories')
export class JobCategoriesController {
  constructor(private service: JobCategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all job categories with base pricing' })
  @ApiResponse({ status: 200, description: 'Array of job categories wrapped in { categories }' })
  findAll() {
    return this.service.findAll();
  }
}
