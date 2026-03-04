export type AdminIngredient = {
  id: string;
  ingredientName: string;
  category: string;
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  densityKgPerL: number | null;
  brixPercent: number | null;
  singleStrengthBrix: number | null;
  titratableAcidityPercent: number | null;
  pH: number | null;
  co2SolubilityRelevant: boolean;
  waterContentPercent: number | null;
  shelfLifeMonths: number | null;
  storageConditions: string | null;
  allergenInfo: string | null;
  vegan: boolean;
  natural: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  hasOverrides?: boolean;
  formulationsCount?: number;
};

export type AdminIngredientListResponse = {
  items: AdminIngredient[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
