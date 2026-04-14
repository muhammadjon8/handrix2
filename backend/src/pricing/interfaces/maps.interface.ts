export interface MapsService {
  estimateTransportCost(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<number>;
}

export const MAPS_SERVICE = 'MAPS_SERVICE';
