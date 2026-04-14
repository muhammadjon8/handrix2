import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { VetHandymanDto } from './dto/vet-handyman.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List all jobs with optional filters (ADMIN only)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'handymanId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated job list' })
  getJobs(
    @Query('status') status?: string,
    @Query('handymanId') handymanId?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getJobs({
      status,
      handymanId,
      clientId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('handymen')
  @ApiOperation({ summary: 'List all handymen (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of handyman profiles with vetting status' })
  getHandymen() {
    return this.adminService.getHandymen();
  }

  @Patch('handymen/:id/vet')
  @ApiOperation({ summary: 'Approve or reject a handyman (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Vetting status updated' })
  @ApiResponse({ status: 404, description: 'Handyman not found' })
  vetHandyman(@Param('id') id: string, @Body() dto: VetHandymanDto) {
    return this.adminService.vetHandyman(id, dto.isVetted);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform-wide statistics (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  getDashboard() {
    return this.adminService.getDashboard();
  }
}
