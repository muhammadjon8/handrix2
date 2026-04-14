import { api } from './api';

export const paymentsService = {
  createIntent: (jobId: string) =>
    api.post<{ clientSecret: string; amount: number; currency: string }>('/payments/intent', { jobId }).then((r) => r.data),

  confirmPayment: (jobId: string, stripePaymentIntentId: string) =>
    api.post<{ paymentId: string; status: string; amount: number; receiptUrl: string }>('/payments/confirm', { jobId, stripePaymentIntentId }).then((r) => r.data),
};
