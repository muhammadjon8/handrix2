import type { JobStatus } from '../types';

export interface ActiveJobState {
  jobId: string | null;
  status: JobStatus | null;
  eta: string | null;
  handymanLocation: { lat: number; lng: number } | null;
  setActiveJob: (jobId: string, status: JobStatus, eta: string | null) => void;
  updateStatus: (status: JobStatus) => void;
  updateHandymanLocation: (lat: number, lng: number) => void;
  clearActiveJob: () => void;
}

export const createActiveJobSlice = (set: (fn: (s: ActiveJobState) => Partial<ActiveJobState>) => void): ActiveJobState => ({
  jobId: null,
  status: null,
  eta: null,
  handymanLocation: null,

  setActiveJob(jobId, status, eta) {
    set(() => ({ jobId, status, eta, handymanLocation: null }));
  },
  updateStatus(status) {
    set(() => ({ status }));
  },
  updateHandymanLocation(lat, lng) {
    set(() => ({ handymanLocation: { lat, lng } }));
  },
  clearActiveJob() {
    set(() => ({ jobId: null, status: null, eta: null, handymanLocation: null }));
  },
});
