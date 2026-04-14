import { Test } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { MAPS_SERVICE } from './interfaces/maps.interface';
import { MATERIALS_SERVICE } from './interfaces/materials.interface';
import { PrismaService } from '../prisma/prisma.service';

describe('PricingService', () => {
  let service: PricingService;

  const mockPrisma = {
    jobCategory: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'cat-1',
        basePrice: 45,
        estimatedDuration: 60,
      }),
    },
    handymanProfile: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  const mockMaps = { estimateTransportCost: jest.fn().mockResolvedValue(10) };
  const mockMaterials = { estimateMaterialCost: jest.fn().mockResolvedValue(20) };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MAPS_SERVICE, useValue: mockMaps },
        { provide: MATERIALS_SERVICE, useValue: mockMaterials },
      ],
    }).compile();
    service = module.get(PricingService);
  });

  it('total equals sum of laborCost + materialCost + transportCost', async () => {
    const result = await service.estimate('cat-1', 40.7128, -74.006);
    expect(result.total).toBe(result.laborCost + result.materialCost + result.transportCost);
  });

  it('laborCost equals category basePrice', async () => {
    const result = await service.estimate('cat-1', 40.7128, -74.006);
    expect(result.laborCost).toBe(45);
  });

  it('currency is USD', async () => {
    const result = await service.estimate('cat-1', 40.7128, -74.006);
    expect(result.currency).toBe('USD');
  });
});
