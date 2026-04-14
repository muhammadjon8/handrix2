import { Body, Controller, Patch, Param, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { HandymenService } from './handymen.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ToggleActiveDto } from './dto/toggle-active.dto';

@ApiTags('handymen')
@ApiBearerAuth('access-token')
@Controller('handymen')
@Roles(UserRole.HANDYMAN)
export class HandymenController {
  constructor(private handymenService: HandymenService) {}

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update handyman GPS location (HANDYMAN only)' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 403, description: 'Can only update own location' })
  updateLocation(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.handymenService.updateLocation(id, req.user.id, dto.lat, dto.lng);
  }

  @Patch(':id/active')
  @ApiOperation({ summary: 'Toggle handyman availability (HANDYMAN only)' })
  @ApiResponse({ status: 200, description: 'Active status updated' })
  @ApiResponse({ status: 403, description: 'Can only toggle own status' })
  toggleActive(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ToggleActiveDto,
  ) {
    return this.handymenService.toggleActive(id, req.user.id, dto.isActive);
  }
}
