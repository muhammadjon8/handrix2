import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MapsService } from '../interfaces/maps.interface';

@Injectable()
export class MapsServiceStub implements MapsService {
  constructor(private config: ConfigService) {}

  async estimateTransportCost(): Promise<number> {
    return parseFloat(this.config.get('DEFAULT_TRANSPORT_COST') ?? '10');
  }
}
