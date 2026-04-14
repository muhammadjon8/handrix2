import { api } from './api';
import type { Category } from '../types';

export const categoriesService = {
  getCategories: () =>
    api.get<{ categories: Category[] }>('/job-categories').then((r) => r.data),
};
