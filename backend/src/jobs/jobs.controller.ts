import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('jobs')
@ApiBearerAuth('access-token')
@Controller()
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post('jobs')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new job (CLIENT only)' })
  @ApiResponse({ status: 201, description: 'Job created with pricing and match triggered' })
  @ApiResponse({ status: 403, description: 'Forbidden – CLIENT role required' })
  create(@Request() req: any, @Body() dto: CreateJobDto) {
    return this.jobsService.create(req.user.id, dto);
  }

  @Post('jobs/:id/confirm')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Confirm a matched handyman for a job (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Job confirmed' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.jobsService.confirm(id, req.user.id);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiResponse({ status: 200, description: 'Job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch('jobs/:id/status')
  @Roles(UserRole.HANDYMAN)
  @ApiOperation({ summary: 'Update job status (HANDYMAN only)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.jobsService.updateStatus(id, req.user.id, dto.status);
  }

  @Get('clients/:id/jobs')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'List jobs for a client (CLIENT only)' })
  @ApiQuery({ name: 'status', required: false, example: 'PENDING' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of client jobs' })
  getClientJobs(
    @Param('id') id: string,
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobsService.getClientJobs(
      id,
      req.user.id,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('handymen/:id/jobs')
  @Roles(UserRole.HANDYMAN)
  @ApiOperation({ summary: 'List jobs for a handyman (HANDYMAN only)' })
  @ApiQuery({ name: 'status', required: false, example: 'CONFIRMED' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of handyman jobs' })
  getHandymanJobs(
    @Param('id') id: string,
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobsService.getHandymanJobs(
      id,
      req.user.id,
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
