export const CO2_HENRY_DEFAULTS = {
  T0_K: 298.15,
  kH0_mol_per_kg_bar: 0.034,
  A_K: 2400,
} as const;

export const CO2_PHYSICS = {
  MW_CO2_g_per_mol: 44.0095,
  ATM_PRESSURE_BAR: 1.01325,
} as const;

export const CO2_INPUT_LIMITS = {
  tempC: {
    min: -1,
    max: 60,
    recommendedMin: 0,
    recommendedMax: 40,
  },
  pressureAbsBar: {
    min: 0,
    max: 12,
    recommendedMax: 8,
  },
  yCO2: {
    min: 0,
    max: 1,
  },
  densityKgL: {
    min: 0.5,
    max: 2.0,
    default: 1.0,
  },
} as const;

export const WATER_VAPOR_ANTOINE = {
  A: 8.07131,
  B: 1730.63,
  C: 233.426,
  mmHgToBar: 0.001333223684,
} as const;
