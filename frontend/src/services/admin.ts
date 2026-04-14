import { api } from './api';

export const adminService = {
  getDashboard: () =>
    api.get<{ activeJobs: number; availableHandymen: number; revenueToday: number }>('/admin/dashboard').then((r) => r.data),

  getAdminJobs: (params?: { status?: string; handymanId?: string; clientId?: string; page?: number; limit?: number }) =>
    api.get('/admin/jobs', { params }).then((r) => r.data),

  getHandymen: () =>
    api.get<{ handymen: Array<{ id: string; name: string; isVetted: boolean; isActive: boolean; rating: number; skills: string[] }> }>('/admin/handymen').then((r) => r.data),

  vetHandyman: (id: string, isVetted: boolean) =>
    api.patch(`/admin/handymen/${id}/vet`, { isVetted }).then((r) => r.data),
};
