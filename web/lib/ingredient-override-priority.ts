export type BaseIngredientSpec = {
  pricePerKgEur: number | null;
  densityKgPerL: number | null;
  brixPercent: number | null;
  titratableAcidityPercent: number | null;
  pH: number | null;
  waterContentPercent: number | null;
};

export type OverrideSpec = {
  id: string;
  overridePricePerKgEur: number | null;
  overrideDensityKgPerL: number | null;
  overrideBrixPercent: number | null;
  overrideTitratableAcidityPercent: number | null;
  overridePH: number | null;
  overrideWaterContentPercent: number | null;
};

export function resolveEffectiveFromOverride(
  base: BaseIngredientSpec,
  override: OverrideSpec | null,
) {
  return {
    effectivePricePerKgEur:
      override?.overridePricePerKgEur ?? base.pricePerKgEur,
    effectiveDensityKgPerL:
      override?.overrideDensityKgPerL ?? base.densityKgPerL,
    effectiveBrixPercent: override?.overrideBrixPercent ?? base.brixPercent,
    effectiveTitratableAcidityPercent:
      override?.overrideTitratableAcidityPercent ??
      base.titratableAcidityPercent,
    effectivePH: override?.overridePH ?? base.pH,
    effectiveWaterContentPercent:
      override?.overrideWaterContentPercent ?? base.waterContentPercent,
    sources: {
      pricePerKgEur:
        override?.overridePricePerKgEur != null ? "overridden" : "database",
      densityKgPerL:
        override?.overrideDensityKgPerL != null ? "overridden" : "database",
      brixPercent:
        override?.overrideBrixPercent != null ? "overridden" : "database",
      titratableAcidityPercent:
        override?.overrideTitratableAcidityPercent != null
          ? "overridden"
          : "database",
      pH: override?.overridePH != null ? "overridden" : "database",
      waterContentPercent:
        override?.overrideWaterContentPercent != null
          ? "overridden"
          : "database",
    },
    overrideId: override?.id ?? null,
  } as const;
}

export function chooseOverrideByPriority<T>(input: {
  formulation?: T | null;
  project?: T | null;
  global?: T | null;
}): T | null {
  return input.formulation ?? input.project ?? input.global ?? null;
}
