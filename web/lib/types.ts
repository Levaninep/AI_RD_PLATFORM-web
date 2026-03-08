export type Ingredient = {
  id: string;
  ingredientName: string;
  name?: string;
  category: "Sweetener" | "Juice" | "Acid" | "Flavor" | "Extract" | "Other";
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  densityKgPerL: number | null;
  brixPercent: number | null;
  singleStrengthBrix: number | null;
  brixDensityTempC?: number | null;
  titratableAcidityPercent: number | null;
  pH: number | null;
  co2SolubilityRelevant: boolean;
  waterContentPercent: number | null;
  energyKcal?: number | null;
  energyKj?: number | null;
  fat?: number | null;
  saturates?: number | null;
  carbohydrates?: number | null;
  sugars?: number | null;
  protein?: number | null;
  salt?: number | null;
  nutritionBasis?: "PER_100G" | "PER_100ML" | null;
  shelfLifeMonths: number | null;
  storageConditions: string | null;
  allergenInfo: string | null;
  vegan: boolean;
  natural: boolean;
  notes: string | null;
  coaFileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  effectivePricePerKgEur?: number | null;
  effectiveDensityKgPerL?: number | null;
  effectiveBrixPercent?: number | null;
  effectiveSingleStrengthBrix?: number | null;
  effectiveTitratableAcidityPercent?: number | null;
  effectivePH?: number | null;
  effectiveWaterContentPercent?: number | null;
  effectiveOverrideId?: string | null;
  valueSources?: {
    pricePerKgEur?: "database" | "overridden";
    densityKgPerL?: "database" | "overridden";
    brixPercent?: "database" | "overridden";
    singleStrengthBrix?: "database" | "overridden";
    titratableAcidityPercent?: "database" | "overridden";
    pH?: "database" | "overridden";
    waterContentPercent?: "database" | "overridden";
  };
  pricePerKg?: number;
  density?: number | null;
  brix?: number | null;
  titratableAcidity?: number | null;
  waterContent?: number | null;
};

export type FormulationLineUnit = "kg" | "g" | "L" | "mL" | "ml" | "%w/w";

export type FormulationIngredient = {
  id: string;
  ingredientId: string;
  amount?: number | null;
  unit?: FormulationLineUnit | null;
  dosageGrams: number;
  priceOverridePerKg?: number | null;
  ingredient: Pick<
    Ingredient,
    | "id"
    | "name"
    | "ingredientName"
    | "category"
    | "pricePerKgEur"
    | "densityKgPerL"
    | "brixPercent"
    | "singleStrengthBrix"
    | "titratableAcidityPercent"
    | "pricePerKg"
    | "density"
    | "brix"
    | "titratableAcidity"
  >;
};

export type Formulation = {
  id: string;
  name: string;
  category: string;
  targetBrix: number | null;
  targetPH: number | null;
  co2GPerL: number | null;
  desiredBrix: number | null;
  temperatureC: number | null;
  correctedBrix: number | null;
  densityGPerML: number | null;
  targetMassPerLiterG: number | null;
  waterGramsPerLiter: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: FormulationIngredient[];
  totalGrams: number;
  totalCostUSD: number;
  costPerKgUSD: number;
};

export type FormulationItemPayload = {
  amount: number;
  unit: FormulationLineUnit;
  ingredientId: string;
  priceOverridePerKg?: number | null;
};

export type CreateFormulationPayload = {
  name: string;
  category: string;
  targetBrix?: number | null;
  targetPH?: number | null;
  co2GPerL?: number | null;
  desiredBrix?: number | null;
  temperatureC?: number | null;
  notes?: string | null;
  items: FormulationItemPayload[];
};

export type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};
