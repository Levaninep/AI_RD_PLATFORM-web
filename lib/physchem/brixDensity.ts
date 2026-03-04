export type BrixDensityWarningCode =
  | "BRIX_OUT_OF_RANGE"
  | "DENSITY_OUT_OF_RANGE"
  | "TEMP_ASSUMED_20C"
  | "MAX_ITERATIONS_REACHED";

export type BrixDensityResult = {
  value: number;
  warnings: BrixDensityWarningCode[];
};

const BRIX_MIN = 0;
const BRIX_MAX = 85;
const DENSITY_MIN = 0.98;
const DENSITY_MAX = 1.45;

function roundDensity(value: number): number {
  return Number(value.toFixed(3));
}

function roundBrix(value: number): number {
  return Number(value.toFixed(1));
}

function densityAt20CFromBrixRaw(brixPercent: number): number {
  const b = brixPercent;
  const sg = 1 + b / (258.6 - (b / 258.2) * 227.1);

  return sg;
}

function withTempWarning(tempC: number): BrixDensityWarningCode[] {
  return Math.abs(tempC - 20) > 1e-9 ? ["TEMP_ASSUMED_20C"] : [];
}

export function densityFromBrix(
  brixPercent: number,
  tempC = 20,
): BrixDensityResult {
  const warnings = withTempWarning(tempC);

  if (
    !Number.isFinite(brixPercent) ||
    brixPercent < BRIX_MIN ||
    brixPercent > BRIX_MAX
  ) {
    return {
      value: Number.NaN,
      warnings: [...warnings, "BRIX_OUT_OF_RANGE"],
    };
  }

  const density = densityAt20CFromBrixRaw(brixPercent);
  return {
    value: roundDensity(density),
    warnings,
  };
}

export function brixFromDensity(
  densityKgPerL: number,
  tempC = 20,
): BrixDensityResult {
  const warnings = withTempWarning(tempC);

  if (
    !Number.isFinite(densityKgPerL) ||
    densityKgPerL < DENSITY_MIN ||
    densityKgPerL > DENSITY_MAX
  ) {
    return {
      value: Number.NaN,
      warnings: [...warnings, "DENSITY_OUT_OF_RANGE"],
    };
  }

  let low = BRIX_MIN;
  let high = BRIX_MAX;
  let iterations = 0;
  let best = BRIX_MIN;

  while (iterations < 80) {
    const mid = (low + high) / 2;
    const densityMid = densityAt20CFromBrixRaw(mid);
    const err = densityMid - densityKgPerL;

    best = mid;

    if (Math.abs(err) < 0.0005) {
      break;
    }

    if (err < 0) {
      low = mid;
    } else {
      high = mid;
    }

    iterations += 1;
  }

  if (iterations >= 80) {
    warnings.push("MAX_ITERATIONS_REACHED");
  }

  return {
    value: roundBrix(best),
    warnings,
  };
}
