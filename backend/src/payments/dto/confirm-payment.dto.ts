import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ example: 'pi_3PfXY2LkdIwHu7ix1234567890' })
  @IsString()
  stripePaymentIntentId: string;
}
