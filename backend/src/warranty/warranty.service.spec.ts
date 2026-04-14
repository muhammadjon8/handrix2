import { Test } from '@nestjs/testing';
import { JobStatus, WarrantyStatus } from '@prisma/client';
import { WarrantyService } from './warranty.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

const makeJob = (status: JobStatus = JobStatus.COMPLETED): any => ({
  id: 'job-1',
  clientId: 'client-1',
  status,
});

describe('WarrantyService', () => {
  let service: WarrantyService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      warranty: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'w-1', ...args.data })),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        WarrantyService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('30') },
        },
      ],
    }).compile();
    service = module.get(WarrantyService);
  });

  it('creates warranty for COMPLETED job with ACTIVE status', async () => {
    const job = makeJob(JobStatus.COMPLETED);
    await service.createForJob(job);
    expect(mockPrisma.warranty.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobId: 'job-1',
          clientId: 'client-1',
          status: WarrantyStatus.ACTIVE,
        }),
      }),
    );
  });

  it('validUntil is approximately 30 days from now', async () => {
    const job = makeJob(JobStatus.COMPLETED);
    await service.createForJob(job);
    const call = mockPrisma.warranty.create.mock.calls[0][0];
    const diff = call.data.validUntil.getTime() - Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(diff).toBeGreaterThan(thirtyDaysMs - 5000);
    expect(diff).toBeLessThan(thirtyDaysMs + 5000);
  });
});
