import { Injectable } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getJobs(filters: {
    status?: string;
    handymanId?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, handymanId, clientId, page = 1, limit = 20 } = filters;
    const where: any = {};
    if (status) where.status = status;
    if (handymanId) where.handymanId = handymanId;
    if (clientId) where.clientId = clientId;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true } },
          client: { select: { name: true, email: true } },
          handyman: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit };
  }

  async getHandymen() {
    const handymen = await this.prisma.handymanProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return handymen.map((h) => ({
      id: h.userId,
      name: h.user.name,
      email: h.user.email,
      isVetted: h.isVetted,
      isActive: h.isActive,
      rating: h.rating,
      skills: h.skills,
    }));
  }

  async vetHandyman(id: string, isVetted: boolean) {
    await this.prisma.handymanProfile.update({
      where: { userId: id },
      data: { isVetted },
    });
    return { id, isVetted };
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeJobs, availableHandymen, revenueToday] = await Promise.all([
      this.prisma.job.count({
        where: {
          status: { in: [JobStatus.MATCHED, JobStatus.EN_ROUTE, JobStatus.ARRIVED, JobStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.handymanProfile.count({ where: { isActive: true, isVetted: true } }),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED', createdAt: { gte: today } },
        _sum: { amount: true },
      }),
    ]);

    return {
      activeJobs,
      availableHandymen,
      revenueToday: Number(revenueToday._sum.amount ?? 0),
    };
  }
}
