import { api } from './api';
import type { Job, JobStatus } from '../types';

export const jobsService = {
  createJob: (body: { categoryId: string; description?: string; locationLat: number; locationLng: number; locationAddress: string }) =>
    api.post<{ jobId: string; status: string; priceEstimate: { laborCost: number; materialCost: number; transportCost: number; total: number; currency: string }; estimatedDuration: number }>('/jobs', body).then((r) => r.data),

  confirmJob: (id: string) =>
    api.post<{ jobId: string; status: string; handyman: { id: string; name: string; avatarUrl: string | null; rating: number }; eta: string }>(`/jobs/${id}/confirm`).then((r) => r.data),

  getJob: (id: string) =>
    api.get<Job>(`/jobs/${id}`).then((r) => r.data),

  updateJobStatus: (id: string, status: JobStatus) =>
    api.patch<{ jobId: string; status: JobStatus; updatedAt: string }>(`/jobs/${id}/status`, { status }).then((r) => r.data),

  getClientJobs: (clientId: string, params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{ jobs: Array<{ jobId: string; category: string; status: JobStatus; quotedPrice: number; finalPrice: number; createdAt: string; warrantyStatus: string | null }>; total: number; page: number; limit: number }>(`/clients/${clientId}/jobs`, { params }).then((r) => r.data),

  getHandymanJobs: (handymanId: string, params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{ jobs: Array<{ jobId: string; category: string; status: JobStatus; payout: number; createdAt: string }>; totalEarned: number; total: number; page: number; limit: number }>(`/handymen/${handymanId}/jobs`, { params }).then((r) => r.data),
};
