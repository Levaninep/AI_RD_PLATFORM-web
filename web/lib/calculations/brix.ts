export type BrixLineInput = {
  name?: string;
  massKg: number;
  brixPercent: number | null;
};

export type WeightedBrixResult = {
  totalMassKg: number;
  totalSolidsKg: number;
  weightedBrixPercent: number | null;
  missingBrixIngredients: string[];
};

export type WaterAdjustmentInput = {
  currentMassKg: number;
  currentBrixPercent: number;
  targetBrixPercent: number;
};

export type WaterAdjustmentResult = {
  initialSolidsKg: number;
  waterToAddKg: number | null;
  finalMassKg: number | null;
  finalBrixPercent: number | null;
  limitation?: string;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateWeightedBrix(
  lines: BrixLineInput[],
): WeightedBrixResult {
  const totalMassKg = lines.reduce(
    (sum, line) => sum + Math.max(0, line.massKg),
    0,
  );
  const missingBrixIngredients = lines
    .filter(
      (line) =>
        line.massKg > 0 &&
        (line.brixPercent == null || !Number.isFinite(line.brixPercent)),
    )
    .map((line) => line.name ?? "Unnamed ingredient");

  const totalSolidsKg = lines.reduce((sum, line) => {
    if (line.brixPercent == null || !Number.isFinite(line.brixPercent)) {
      return sum;
    }

    return sum + Math.max(0, line.massKg) * (line.brixPercent / 100);
  }, 0);

  return {
    totalMassKg: round(totalMassKg),
    totalSolidsKg: round(totalSolidsKg),
    weightedBrixPercent:
      totalMassKg > 0 ? round((totalSolidsKg / totalMassKg) * 100) : null,
    missingBrixIngredients,
  };
}

export function estimateWaterForTargetBrix(
  input: WaterAdjustmentInput,
): WaterAdjustmentResult {
  if (
    !Number.isFinite(input.currentMassKg) ||
    !Number.isFinite(input.currentBrixPercent) ||
    !Number.isFinite(input.targetBrixPercent) ||
    input.currentMassKg <= 0 ||
    input.currentBrixPercent <= 0 ||
    input.targetBrixPercent <= 0
  ) {
    return {
      initialSolidsKg: 0,
      waterToAddKg: null,
      finalMassKg: null,
      finalBrixPercent: null,
      limitation:
        "Current mass, current Brix, and target Brix must all be positive numbers.",
    };
  }

  if (input.targetBrixPercent >= input.currentBrixPercent) {
    return {
      initialSolidsKg: round(
        input.currentMassKg * (input.currentBrixPercent / 100),
      ),
      waterToAddKg: null,
      finalMassKg: null,
      finalBrixPercent: null,
      limitation:
        "Target Brix must be lower than current Brix when estimating added water.",
    };
  }

  const initialSolidsKg =
    input.currentMassKg * (input.currentBrixPercent / 100);
  const finalMassKg = initialSolidsKg / (input.targetBrixPercent / 100);
  const waterToAddKg = finalMassKg - input.currentMassKg;

  return {
    initialSolidsKg: round(initialSolidsKg),
    waterToAddKg: round(waterToAddKg),
    finalMassKg: round(finalMassKg),
    finalBrixPercent: round(input.targetBrixPercent),
  };
}

// Future extension: add blending optimization across multiple concentrates.
