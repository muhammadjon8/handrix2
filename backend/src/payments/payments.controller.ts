import { Body, Controller, Headers, Post, Req, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreateIntentDto } from './dto/create-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent')
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a Stripe payment intent for a job (CLIENT only)' })
  @ApiResponse({ status: 201, description: 'Returns Stripe clientSecret' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  createIntent(@Request() req: any, @Body() dto: CreateIntentDto) {
    return this.paymentsService.createIntent(req.user.id, dto.jobId);
  }

  @Post('confirm')
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm payment after Stripe client-side confirmation (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed, job payment status updated' })
  confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(dto.jobId, dto.stripePaymentIntentId);
  }

  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint()
  handleWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    return this.paymentsService.handleWebhook(req.rawBody as Buffer, signature);
  }
}
