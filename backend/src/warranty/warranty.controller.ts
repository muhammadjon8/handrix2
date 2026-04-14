import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { WarrantyService } from './warranty.service';
import { FileClaimDto } from './dto/file-claim.dto';

@ApiTags('warranties')
@ApiBearerAuth('access-token')
@Controller('warranties')
export class WarrantyController {
  constructor(private warrantyService: WarrantyService) {}

  @Get(':jobId')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get warranty details for a completed job (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Warranty details with claims' })
  @ApiResponse({ status: 404, description: 'Warranty not found for this job' })
  findByJob(@Param('jobId') jobId: string) {
    return this.warrantyService.findByJob(jobId);
  }

  @Post(':jobId/claim')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'File a warranty claim for a job (CLIENT only)' })
  @ApiResponse({ status: 201, description: 'Claim filed successfully' })
  @ApiResponse({ status: 400, description: 'Warranty expired or job not eligible' })
  fileClaim(
    @Param('jobId') jobId: string,
    @Request() req: any,
    @Body() dto: FileClaimDto,
  ) {
    return this.warrantyService.fileClaim(jobId, req.user.id, dto.description, dto.photoUrl);
  }
}
