import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PricingService } from './pricing.service';
import { OsmMapsService } from './osm-maps.service';
import { MaterialsServiceStub } from './stubs/materials.stub';
import { MAPS_SERVICE } from './interfaces/maps.interface';
import { MATERIALS_SERVICE } from './interfaces/materials.interface';

@Module({
  providers: [
    PricingService,
    {
      provide: MAPS_SERVICE,
      useFactory: (config: ConfigService) => new OsmMapsService(config),
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
