import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VetHandymanDto {
  @ApiProperty({ example: true, description: 'Set to true to approve, false to reject' })
  @IsBoolean()
  isVetted: boolean;
}
