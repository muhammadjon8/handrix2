import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobsGateway } from '../websocket/jobs.gateway';
import { JobStatus } from '@prisma/client';

@Injectable()
export class HandymenService {
  constructor(
    private prisma: PrismaService,
    private jobsGateway: JobsGateway,
  ) {}

  async updateLocation(handymanId: string, requesterId: string, lat: number, lng: number) {
    if (handymanId !== requesterId) throw new ForbiddenException();

    await this.prisma.handymanProfile.update({
      where: { userId: handymanId },
      data: { currentLat: lat, currentLng: lng },
    });

    // Emit to any client currently tracking this handyman
    const activeJob = await this.prisma.job.findFirst({
      where: {
        handymanId,
        status: { in: [JobStatus.MATCHED, JobStatus.EN_ROUTE, JobStatus.ARRIVED, JobStatus.IN_PROGRESS] },
      },
    });

    if (activeJob) {
      this.jobsGateway.emitHandymanLocation(activeJob.id, {
        jobId: activeJob.id,
        lat,
        lng,
        eta: activeJob.eta?.toISOString() ?? null,
      });
    }

    return { updated: true };
  }

  async toggleActive(handymanId: string, requesterId: string, isActive: boolean) {
    if (handymanId !== requesterId) throw new ForbiddenException();
    await this.prisma.handymanProfile.update({
      where: { userId: handymanId },
      data: { isActive },
    });
    return { isActive };
  }
}
