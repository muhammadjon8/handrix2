import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.jobCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        basePrice: true,
        estimatedDuration: true,
      },
      orderBy: { name: 'asc' },
    });
    return {
      categories: categories.map((c) => ({
        ...c,
        basePrice: Number(c.basePrice),
      })),
    };
  }
}
