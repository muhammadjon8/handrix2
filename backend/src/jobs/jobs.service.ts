import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { MatchingService } from '../matching/matching.service';
import { JobsGateway } from '../websocket/jobs.gateway';
import { WarrantyService } from '../warranty/warranty.service';
import { CreateJobDto } from './dto/create-job.dto';

const STATUS_ORDER: JobStatus[] = [
  JobStatus.PENDING,
  JobStatus.MATCHED,
  JobStatus.EN_ROUTE,
  JobStatus.ARRIVED,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
];

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  MATCHED: [JobStatus.EN_ROUTE],
  EN_ROUTE: [JobStatus.ARRIVED],
  ARRIVED: [JobStatus.IN_PROGRESS],
  IN_PROGRESS: [JobStatus.COMPLETED],
  PENDING: [],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    private matching: MatchingService,
    private jobsGateway: JobsGateway,
    private warrantyService: WarrantyService,
  ) {}

  async create(clientId: string, dto: CreateJobDto) {
    const estimate = await this.pricing.estimate(
      dto.categoryId,
      dto.locationLat,
      dto.locationLng,
    );

    const category = await this.prisma.jobCategory.findUniqueOrThrow({
      where: { id: dto.categoryId },
    });

    const job = await this.prisma.job.create({
      data: {
        clientId,
        categoryId: dto.categoryId,
        description: dto.description,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationAddress: dto.locationAddress,
        status: JobStatus.PENDING,
        quotedPrice: estimate.total,
        laborCost: estimate.laborCost,
        materialCost: estimate.materialCost,
        transportCost: estimate.transportCost,
      },
    });

    return {
      jobId: job.id,
      status: job.status,
      priceEstimate: {
        laborCost: estimate.laborCost,
        materialCost: estimate.materialCost,
        transportCost: estimate.transportCost,
        total: estimate.total,
        currency: estimate.currency,
      },
      estimatedDuration: category.estimatedDuration,
    };
  }

  async confirm(jobId: string, clientId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { category: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== clientId) throw new ForbiddenException();
    if (job.status !== JobStatus.PENDING) {
      throw new ConflictException('Job is not in PENDING status');
    }

    return this.matching.match(job);
  }

  async findOne(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        category: { select: { id: true, name: true } },
        handyman: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');

    const handymanProfile = job.handymanId
      ? await this.prisma.handymanProfile.findUnique({ where: { userId: job.handymanId } })
      : null;

    return {
      jobId: job.id,
      status: job.status,
      category: job.category,
      description: job.description,
      locationAddress: job.locationAddress,
      locationLat: job.locationLat,
      locationLng: job.locationLng,
      quotedPrice: Number(job.quotedPrice),
      finalPrice: job.finalPrice ? Number(job.finalPrice) : null,
      laborCost: Number(job.laborCost),
      materialCost: Number(job.materialCost),
      transportCost: Number(job.transportCost),
      eta: job.eta?.toISOString() ?? null,
      handyman: job.handyman
        ? {
            id: job.handyman.id,
            name: job.handyman.name,
            avatarUrl: job.handyman.avatarUrl,
            rating: handymanProfile?.rating ?? 0,
          }
        : null,
      createdAt: job.createdAt.toISOString(),
    };
  }

  async updateStatus(jobId: string, handymanId: string, newStatus: JobStatus) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.handymanId !== handymanId) throw new ForbiddenException();

    const allowed = VALID_TRANSITIONS[job.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${job.status} to ${newStatus}`,
      );
    }

    const updates: any = { status: newStatus };
    if (newStatus === JobStatus.COMPLETED) {
      updates.finalPrice = job.quotedPrice;
    }

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: updates,
    });

    this.jobsGateway.emitJobStatusUpdate(jobId, {
      jobId,
      status: newStatus,
      updatedAt: updated.updatedAt.toISOString(),
    });

    if (newStatus === JobStatus.COMPLETED) {
      const warranty = await this.warrantyService.createForJob(updated);
      this.jobsGateway.emitJobCompleted(jobId, {
        jobId,
        finalPrice: Number(updated.finalPrice),
        warrantyId: warranty.id,
      });
    }

    return { jobId, status: updated.status, updatedAt: updated.updatedAt.toISOString() };
  }

  async getClientJobs(
    clientId: string,
    requesterId: string,
    status?: string,
    page = 1,
    limit = 10,
  ) {
    if (clientId !== requesterId) throw new ForbiddenException();

    const where: any = { clientId };
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { name: true } }, warranty: { select: { status: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      jobs: jobs.map((j) => ({
        jobId: j.id,
        category: j.category.name,
        status: j.status,
        quotedPrice: Number(j.quotedPrice),
        finalPrice: j.finalPrice ? Number(j.finalPrice) : null,
        createdAt: j.createdAt.toISOString(),
        warrantyStatus: j.warranty?.status ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  async getHandymanJobs(
    handymanId: string,
    requesterId: string,
    status?: string,
    page = 1,
    limit = 10,
  ) {
    if (handymanId !== requesterId) throw new ForbiddenException();

    const where: any = { handymanId };
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    const totalEarned = await this.prisma.job.aggregate({
      where: { handymanId, status: JobStatus.COMPLETED },
      _sum: { finalPrice: true },
    });

    return {
      jobs: jobs.map((j) => ({
        jobId: j.id,
        category: j.category.name,
        status: j.status,
        payout: Number(j.finalPrice ?? j.quotedPrice) * 0.8,
        createdAt: j.createdAt.toISOString(),
      })),
      totalEarned: Number(totalEarned._sum.finalPrice ?? 0) * 0.8,
      total,
      page,
      limit,
    };
  }
}
