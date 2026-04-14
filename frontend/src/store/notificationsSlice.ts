import type { Toast } from '../types';

export interface NotificationsState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const createNotificationsSlice = (set: (fn: (s: NotificationsState) => Partial<NotificationsState>) => void): NotificationsState => ({
  toasts: [],
  addToast(message, type = 'info') {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  removeToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
});
