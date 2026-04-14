import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 40.7128 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -74.006 })
  @IsNumber()
  lng: number;
}
