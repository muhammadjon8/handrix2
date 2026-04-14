import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Job, JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsGateway } from '../websocket/jobs.gateway';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private jobsGateway: JobsGateway,
  ) {}

  async match(job: Job & { category: { name: string; skillTags: string[]; basePrice: any } }) {
    const candidates = await this.prisma.handymanProfile.findMany({
      where: { isActive: true, isVetted: true },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Filter by skill overlap
    const skilled = candidates.filter((c) =>
      c.skills.some((s) => job.category.skillTags.includes(s)),
    );

    if (skilled.length === 0) {
      throw new UnprocessableEntityException('No available handyman for this job');
    }

    // Sort by Haversine distance
    const ranked = skilled
      .filter((c) => c.currentLat !== null && c.currentLng !== null)
      .sort(
        (a, b) =>
          haversineKm(a.currentLat!, a.currentLng!, job.locationLat, job.locationLng) -
          haversineKm(b.currentLat!, b.currentLng!, job.locationLat, job.locationLng),
      );

    // Fall back to any skilled handyman if none have location set
    const ordered = ranked.length > 0 ? ranked : skilled;

    for (const candidate of ordered) {
      // Optimistic lock: verify still active before writing
      const current = await this.prisma.handymanProfile.findUnique({
        where: { id: candidate.id },
      });
      if (!current?.isActive || !current?.isVetted) continue;

      const eta = new Date(Date.now() + 20 * 60 * 1000); // default 20 min ETA
      const distanceKm =
        candidate.currentLat && candidate.currentLng
          ? haversineKm(
              candidate.currentLat,
              candidate.currentLng,
              job.locationLat,
              job.locationLng,
            )
          : 5;

      const updated = await this.prisma.job.update({
        where: { id: job.id },
        data: {
          handymanId: candidate.userId,
          status: JobStatus.MATCHED,
          eta,
        },
        include: {
          handyman: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      // Join both parties to the job room
      await this.jobsGateway.joinJobRoom(job.clientId, job.id);
      await this.jobsGateway.joinJobRoom(candidate.userId, job.id);

      // Emit to client
      this.jobsGateway.emitJobMatched(job.id, {
        jobId: job.id,
        handymanName: candidate.user.name,
        handymanAvatar: candidate.user.avatarUrl,
        eta: eta.toISOString(),
      });

      // Emit to handyman
      this.jobsGateway.emitJobAvailable(candidate.userId, {
        jobId: job.id,
        categoryName: job.category.name,
        distanceKm: Math.round(distanceKm * 10) / 10,
        payoutEstimate: Number(job.category.basePrice) * 0.8,
        eta: eta.toISOString(),
      });

      return {
        jobId: job.id,
        status: JobStatus.MATCHED,
        handyman: {
          id: candidate.userId,
          name: candidate.user.name,
          avatarUrl: candidate.user.avatarUrl,
          rating: candidate.rating,
        },
        eta: eta.toISOString(),
      };
    }

    throw new UnprocessableEntityException('No available handyman for this job');
  }
}
