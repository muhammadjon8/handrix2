import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'Job category UUID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'Fix the kitchen sink' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 40.7128, description: 'Latitude of the job location' })
  @IsNumber()
  locationLat: number;

  @ApiProperty({ example: -74.006, description: 'Longitude of the job location' })
  @IsNumber()
  locationLng: number;

  @ApiProperty({ example: '123 Main St, New York, NY 10001' })
  @IsString()
  locationAddress: string;
}
