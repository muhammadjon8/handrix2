import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MaterialsService } from '../interfaces/materials.interface';

@Injectable()
export class MaterialsServiceStub implements MaterialsService {
  constructor(private config: ConfigService) {}

  async estimateMaterialCost(): Promise<number> {
    return parseFloat(this.config.get('DEFAULT_MATERIAL_COST') ?? '20');
  }
}
