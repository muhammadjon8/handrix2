import { IsEnum } from 'class-validator';
import { JobStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({ enum: ['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'] })
  @IsEnum(['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'])
  status: JobStatus;
}
