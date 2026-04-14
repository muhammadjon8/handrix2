export interface MaterialsService {
  estimateMaterialCost(categoryId: string): Promise<number>;
}

export const MATERIALS_SERVICE = 'MATERIALS_SERVICE';
