import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobCategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.jobCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        basePrice: true,
        estimatedDuration: true,
      },
    });
  }
}
