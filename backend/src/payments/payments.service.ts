import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, PaymentStatus } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const StripeClass = StripeLib.default ?? StripeLib;
    this.stripe = new StripeClass(
      this.config.get('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder',
    );
  }

  async createIntent(clientId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== clientId) throw new ForbiddenException();
    if (job.status !== JobStatus.COMPLETED) {
      throw new UnprocessableEntityException('Job is not completed');
    }

    const amountCents = Math.round(Number(job.quotedPrice) * 100);
    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { jobId },
    });

    return {
      clientSecret: intent.client_secret,
      amount: Number(job.quotedPrice),
      currency: 'USD',
    };
  }

  async confirmPayment(jobId: string, stripePaymentIntentId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const intent = await this.stripe.paymentIntents.retrieve(stripePaymentIntentId);
    const status =
      intent.status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;

    const payment = await this.prisma.payment.upsert({
      where: { jobId },
      create: {
        jobId,
        clientId: job.clientId,
        amount: job.quotedPrice,
        stripePaymentId: stripePaymentIntentId,
        status,
      },
      update: { status, stripePaymentId: stripePaymentIntentId },
    });

    if (status === PaymentStatus.SUCCEEDED) {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { finalPrice: job.quotedPrice },
      });
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      amount: Number(payment.amount),
      receiptUrl: payment.receiptUrl ?? null,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) throw new BadRequestException('Webhook not configured');

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    const intent = event.data.object as any;
    const jobId = intent.metadata?.jobId;
    if (!jobId) return { received: true };

    if (event.type === 'payment_intent.succeeded') {
      await this.prisma.payment.updateMany({
        where: { stripePaymentId: intent.id },
        data: { status: PaymentStatus.SUCCEEDED },
      });
      await this.prisma.job.update({
        where: { id: jobId },
        data: { finalPrice: intent.amount / 100 },
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      await this.prisma.payment.updateMany({
        where: { stripePaymentId: intent.id },
        data: { status: PaymentStatus.FAILED },
      });
    }

    return { received: true };
  }
}
