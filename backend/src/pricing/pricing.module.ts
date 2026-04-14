import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PricingService } from './pricing.service';
import { MapsServiceStub } from './stubs/maps.stub';
import { MaterialsServiceStub } from './stubs/materials.stub';
import { MAPS_SERVICE } from './interfaces/maps.interface';
import { MATERIALS_SERVICE } from './interfaces/materials.interface';

@Module({
  providers: [
    PricingService,
    {
      provide: MAPS_SERVICE,
      useFactory: (config: ConfigService) => new MapsServiceStub(config),
      inject: [ConfigService],
    },
    {
      provide: MATERIALS_SERVICE,
      useFactory: (config: ConfigService) => new MaterialsServiceStub(config),
      inject: [ConfigService],
    },
  ],
  exports: [PricingService],
})
export class PricingModule {}
