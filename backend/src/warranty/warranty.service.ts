import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Job, WarrantyStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarrantyService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async createForJob(job: Job) {
    const days = parseInt(this.config.get('WARRANTY_PERIOD_DAYS') ?? '30');
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.warranty.create({
      data: {
        jobId: job.id,
        clientId: job.clientId,
        validUntil,
        status: WarrantyStatus.ACTIVE,
      },
    });
  }

  async findByJob(jobId: string) {
    const warranty = await this.prisma.warranty.findUnique({ where: { jobId } });
    if (!warranty) throw new NotFoundException('Warranty not found');
    return {
      warrantyId: warranty.id,
      jobId: warranty.jobId,
      status: warranty.status,
      validUntil: warranty.validUntil.toISOString(),
      createdAt: warranty.createdAt.toISOString(),
    };
  }

  async fileClaim(jobId: string, clientId: string, description: string, photoUrl?: string) {
    const warranty = await this.prisma.warranty.findUnique({ where: { jobId } });
    if (!warranty) throw new NotFoundException('Warranty not found');
    if (warranty.clientId !== clientId) throw new ConflictException('Forbidden');
    if (warranty.status === WarrantyStatus.CLAIMED) {
      throw new ConflictException('Claim already filed');
    }
    if (warranty.status === WarrantyStatus.EXPIRED || warranty.validUntil < new Date()) {
      throw new UnprocessableEntityException('Warranty has expired');
    }

    const [claim] = await this.prisma.$transaction([
      this.prisma.warrantyClaim.create({
        data: { warrantyId: warranty.id, description, photoUrl },
      }),
      this.prisma.warranty.update({
        where: { id: warranty.id },
        data: { status: WarrantyStatus.CLAIMED },
      }),
    ]);

    return {
      claimId: claim.id,
      warrantyId: warranty.id,
      status: claim.status,
      createdAt: claim.createdAt.toISOString(),
    };
  }
}
