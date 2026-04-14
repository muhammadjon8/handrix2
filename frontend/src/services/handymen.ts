import { api } from './api';

export const handymenService = {
  updateLocation: (id: string, lat: number, lng: number) =>
    api.patch<{ updated: boolean }>(`/handymen/${id}/location`, { lat, lng }).then((r) => r.data),

  toggleActive: (id: string, isActive: boolean) =>
    api.patch(`/handymen/${id}/active`, { isActive }).then((r) => r.data),
};
