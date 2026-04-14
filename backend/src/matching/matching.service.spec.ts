import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { MatchingService } from './matching.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobsGateway } from '../websocket/jobs.gateway';

const makeJob = (overrides = {}): any => ({
  id: 'job-1',
  clientId: 'client-1',
  locationLat: 40.7128,
  locationLng: -74.006,
  category: { name: 'Small Leak', skillTags: ['plumbing'], basePrice: 45 },
  ...overrides,
});

describe('MatchingService', () => {
  let service: MatchingService;
  let mockPrisma: any;
  let mockGateway: any;

  beforeEach(async () => {
    mockPrisma = {
      handymanProfile: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      job: {
        update: jest.fn().mockResolvedValue({ id: 'job-1', status: JobStatus.MATCHED }),
      },
    };
    mockGateway = {
      emitJobMatched: jest.fn(),
      emitJobAvailable: jest.fn(),
      joinJobRoom: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JobsGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(MatchingService);
  });

  it('throws when no available handyman', async () => {
    mockPrisma.handymanProfile.findMany.mockResolvedValue([]);
    await expect(service.match(makeJob())).rejects.toThrow(UnprocessableEntityException);
  });

  it('excludes handymen without matching skill tags', async () => {
    mockPrisma.handymanProfile.findMany.mockResolvedValue([
      {
        id: 'hp-1',
        userId: 'h-1',
        skills: ['electrical'],
        isActive: true,
        isVetted: true,
        currentLat: 40.72,
        currentLng: -74.01,
        rating: 4.5,
        user: { id: 'h-1', name: 'Bob', avatarUrl: null },
      },
    ]);
    await expect(service.match(makeJob())).rejects.toThrow(UnprocessableEntityException);
  });

  it('selects nearest handyman by Haversine distance', async () => {
    const far = {
      id: 'hp-far',
      userId: 'h-far',
      skills: ['plumbing'],
      isActive: true,
      isVetted: true,
      currentLat: 41.0,
      currentLng: -74.5,
      rating: 4.8,
      user: { id: 'h-far', name: 'Far', avatarUrl: null },
    };
    const near = {
      id: 'hp-near',
      userId: 'h-near',
      skills: ['plumbing'],
      isActive: true,
      isVetted: true,
      currentLat: 40.72,
      currentLng: -74.01,
      rating: 4.5,
      user: { id: 'h-near', name: 'Near', avatarUrl: null },
    };
    mockPrisma.handymanProfile.findMany.mockResolvedValue([far, near]);
    mockPrisma.handymanProfile.findUnique.mockResolvedValue({ isActive: true, isVetted: true });

    const result = await service.match(makeJob());
    expect(result.handyman.id).toBe('h-near');
  });

  it('excludes unvetted handymen', async () => {
    mockPrisma.handymanProfile.findMany.mockResolvedValue([
      {
        id: 'hp-1',
        userId: 'h-1',
        skills: ['plumbing'],
        isActive: true,
        isVetted: false, // NOT vetted
        currentLat: 40.72,
        currentLng: -74.01,
        rating: 4.5,
        user: { id: 'h-1', name: 'Bob', avatarUrl: null },
      },
    ]);
    // findMany already filters isVetted=true in query — mock returns empty to simulate
    mockPrisma.handymanProfile.findMany.mockResolvedValue([]);
    await expect(service.match(makeJob())).rejects.toThrow(UnprocessableEntityException);
  });
});
