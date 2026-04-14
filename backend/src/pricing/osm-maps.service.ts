import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MapsService } from './interfaces/maps.interface';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class OsmMapsService implements MapsService {
  private readonly costPerKm: number;
  private readonly defaultCost: number;

  constructor(private config: ConfigService) {
    this.costPerKm = parseFloat(config.get('TRANSPORT_COST_PER_KM') ?? '2.0');
    this.defaultCost = parseFloat(config.get('DEFAULT_TRANSPORT_COST') ?? '10');
  }

  async estimateTransportCost(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<number> {
    // No coordinates available — fall back to configured default
    if (!fromLat && !fromLng && !toLat && !toLng) {
      return this.defaultCost;
    }
    const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
    return Math.round(distanceKm * this.costPerKm * 100) / 100;
  }
}
