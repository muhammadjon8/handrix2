import { api } from './api';
import type { WarrantyStatus } from '../types';

export const warrantiesService = {
  getWarranty: (jobId: string) =>
    api.get<{ warrantyId: string; jobId: string; status: WarrantyStatus; validUntil: string; createdAt: string }>(`/warranties/${jobId}`).then((r) => r.data),

  fileClaim: (jobId: string, body: { description: string; photoUrl?: string }) =>
    api.post<{ claimId: string; warrantyId: string; status: string; createdAt: string }>(`/warranties/${jobId}/claim`, body).then((r) => r.data),
};
