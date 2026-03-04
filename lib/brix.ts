export const BRIX_TEMP_CORRECTION: Record<number, number> = {
  10: 0.4,
  11: 0.35,
  12: 0.3,
  13: 0.25,
  14: 0.2,
  15: 0.15,
  16: 0.12,
  17: 0.09,
  18: 0.06,
  19: 0.03,
  20: 0,
  21: 0.03,
  22: 0.06,
  23: 0.09,
  24: 0.12,
  25: 0.15,
  26: 0.2,
  27: 0.25,
  28: 0.3,
  29: 0.35,
  30: 0.4,
};

export const BRIX_DENSITY_TABLE = [
  { brix: 0, density: 0.9982 },
  { brix: 5, density: 1.0198 },
  { brix: 10, density: 1.04 },
  { brix: 15, density: 1.061 },
  { brix: 20, density: 1.083 },
  { brix: 25, density: 1.106 },
  { brix: 30, density: 1.129 },
  { brix: 35, density: 1.153 },
  { brix: 40, density: 1.178 },
  { brix: 45, density: 1.204 },
  { brix: 50, density: 1.231 },
  { brix: 55, density: 1.259 },
  { brix: 60, density: 1.288 },
  { brix: 65, density: 1.318 },
  { brix: 70, density: 1.349 },
] as const;

export function applyBrixTemperatureCorrection(
  readingBrix: number,
  temperatureC: number,
): number {
  if (!Number.isFinite(readingBrix) || !Number.isFinite(temperatureC)) {
    return Number.isFinite(readingBrix) ? Math.max(0, readingBrix) : 0;
  }

  const nearestTemperature = Math.round(temperatureC);
  if (nearestTemperature < 10 || nearestTemperature > 30) {
    return Math.max(0, readingBrix);
  }

  if (nearestTemperature === 20) {
    return Math.max(0, readingBrix);
  }

  const correction = BRIX_TEMP_CORRECTION[nearestTemperature] ?? 0;
  const corrected =
    nearestTemperature < 20
      ? readingBrix - correction
      : readingBrix + correction;

  return Math.max(0, corrected);
}

export function brixToDensityGPerML(brix: number): number {
  const clampedBrix = Math.max(0, Math.min(70, brix));

  if (clampedBrix <= BRIX_DENSITY_TABLE[0].brix) {
    return BRIX_DENSITY_TABLE[0].density;
  }

  const last = BRIX_DENSITY_TABLE[BRIX_DENSITY_TABLE.length - 1];
  if (clampedBrix >= last.brix) {
    return last.density;
  }

  for (let index = 0; index < BRIX_DENSITY_TABLE.length - 1; index += 1) {
    const left = BRIX_DENSITY_TABLE[index];
    const right = BRIX_DENSITY_TABLE[index + 1];

    if (clampedBrix < left.brix || clampedBrix > right.brix) {
      continue;
    }

    const span = right.brix - left.brix;
    const ratio = span === 0 ? 0 : (clampedBrix - left.brix) / span;

    return left.density + (right.density - left.density) * ratio;
  }

  return last.density;
}
