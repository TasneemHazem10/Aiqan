import { DuaCategory } from '../types';

const duasData: DuaCategory[] = require('../data/duas.json');

const CATEGORY_CACHE: Record<string, DuaCategory> = {};

export function getOfflineDuaCategories(): DuaCategory[] {
  return duasData.map((cat) => ({
    ...cat,
    duaCount: cat.duas?.length ?? 0,
  }));
}

export function getOfflineDuaCategory(id: string): DuaCategory | null {
  if (CATEGORY_CACHE[id]) return CATEGORY_CACHE[id];

  const cat = duasData.find((c) => c.id === id);
  if (!cat) return null;

  CATEGORY_CACHE[id] = cat;
  return cat;
}
