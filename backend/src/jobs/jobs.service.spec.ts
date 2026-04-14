import { UnprocessableEntityException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';

// Isolated test for status transition validation logic
const VALID_TRANSITIONS: Record<string, JobStatus[]> = {
  MATCHED: [JobStatus.EN_ROUTE],
  EN_ROUTE: [JobStatus.ARRIVED],
  ARRIVED: [JobStatus.IN_PROGRESS],
  IN_PROGRESS: [JobStatus.COMPLETED],
  PENDING: [],
  COMPLETED: [],
  CANCELLED: [],
};

function assertValidTransition(current: JobStatus, next: JobStatus) {
  const allowed = VALID_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new UnprocessableEntityException(`Cannot transition from ${current} to ${next}`);
  }
}

describe('Job status transition guard', () => {
  it('allows MATCHED → EN_ROUTE', () => {
    expect(() => assertValidTransition(JobStatus.MATCHED, JobStatus.EN_ROUTE)).not.toThrow();
  });

  it('allows EN_ROUTE → ARRIVED', () => {
    expect(() => assertValidTransition(JobStatus.EN_ROUTE, JobStatus.ARRIVED)).not.toThrow();
  });

  it('allows IN_PROGRESS → COMPLETED', () => {
    expect(() =>
      assertValidTransition(JobStatus.IN_PROGRESS, JobStatus.COMPLETED),
    ).not.toThrow();
  });

  it('rejects MATCHED → IN_PROGRESS (skipping steps)', () => {
    expect(() =>
      assertValidTransition(JobStatus.MATCHED, JobStatus.IN_PROGRESS),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects PENDING → COMPLETED', () => {
    expect(() =>
      assertValidTransition(JobStatus.PENDING, JobStatus.COMPLETED),
    ).toThrow(UnprocessableEntityException);
  });

  it('rejects COMPLETED → any', () => {
    expect(() =>
      assertValidTransition(JobStatus.COMPLETED, JobStatus.EN_ROUTE),
    ).toThrow(UnprocessableEntityException);
  });
});
