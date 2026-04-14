import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MapsService } from './interfaces/maps.interface';
import { MAPS_SERVICE } from './interfaces/maps.interface';
import type { MaterialsService } from './interfaces/materials.interface';
import { MATERIALS_SERVICE } from './interfaces/materials.interface';

export interface PriceEstimate {
  laborCost: number;
  materialCost: number;
  transportCost: number;
  total: number;
  currency: string;
}

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    @Inject(MAPS_SERVICE) private mapsService: MapsService,
    @Inject(MATERIALS_SERVICE) private materialsService: MaterialsService,
  ) {}

  async estimate(
    categoryId: string,
    locationLat: number,
    locationLng: number,
  ): Promise<PriceEstimate> {
    const category = await this.prisma.jobCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Job category not found');

    const laborCost = Number(category.basePrice);

    const materialCost = await this.materialsService.estimateMaterialCost(categoryId);

    // Find nearest available handyman for transport estimate
    const nearestHandyman = await this.prisma.handymanProfile.findFirst({
      where: { isActive: true, isVetted: true, currentLat: { not: null }, currentLng: { not: null } },
    });

    let transportCost: number;
    if (nearestHandyman?.currentLat && nearestHandyman?.currentLng) {
      transportCost = await this.mapsService.estimateTransportCost(
        nearestHandyman.currentLat,
        nearestHandyman.currentLng,
        locationLat,
        locationLng,
      );
    } else {
      transportCost = await this.mapsService.estimateTransportCost(0, 0, 0, 0);
    }

    const total = laborCost + materialCost + transportCost;

    return { laborCost, materialCost, transportCost, total, currency: 'USD' };
  }
}
