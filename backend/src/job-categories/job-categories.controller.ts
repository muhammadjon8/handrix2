import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobCategoriesService } from './job-categories.service';

@ApiTags('job-categories')
@ApiBearerAuth('access-token')
@Controller('job-categories')
export class JobCategoriesController {
  constructor(private service: JobCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all job categories with base pricing' })
  @ApiResponse({ status: 200, description: 'Array of job categories' })
  findAll() {
    return this.service.findAll();
  }
}
