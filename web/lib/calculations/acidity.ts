export type AcidityLineInput = {
  name?: string;
  massKg: number;
  acidityPercent: number | null;
};

export type WeightedAcidityResult = {
  totalMassKg: number;
  totalAcidKg: number;
  weightedAcidityPercent: number | null;
  weightedAcidityGPerL: number | null;
  missingAcidityIngredients: string[];
};

export type AcidityAdjustmentInput = {
  currentMassKg: number;
  currentAcidityPercent: number;
  targetAcidityPercent: number;
  acidulantStrengthPercent?: number;
};

export type AcidityAdjustmentResult = {
  currentAcidKg: number;
  acidToAddKg: number | null;
  finalAcidityPercent: number | null;
  assumption: string;
  limitation?: string;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateWeightedAcidity(
  lines: AcidityLineInput[],
): WeightedAcidityResult {
  const totalMassKg = lines.reduce(
    (sum, line) => sum + Math.max(0, line.massKg),
    0,
  );
  const missingAcidityIngredients = lines
    .filter(
      (line) =>
        line.massKg > 0 &&
        (line.acidityPercent == null || !Number.isFinite(line.acidityPercent)),
    )
    .map((line) => line.name ?? "Unnamed ingredient");

  const totalAcidKg = lines.reduce((sum, line) => {
    if (line.acidityPercent == null || !Number.isFinite(line.acidityPercent)) {
      return sum;
    }

    return sum + Math.max(0, line.massKg) * (line.acidityPercent / 100);
  }, 0);

  const weightedAcidityPercent =
    totalMassKg > 0 ? (totalAcidKg / totalMassKg) * 100 : null;

  return {
    totalMassKg: round(totalMassKg),
    totalAcidKg: round(totalAcidKg),
    weightedAcidityPercent:
      weightedAcidityPercent != null ? round(weightedAcidityPercent) : null,
    weightedAcidityGPerL:
      weightedAcidityPercent != null
        ? round(weightedAcidityPercent * 10)
        : null,
    missingAcidityIngredients,
  };
}

export function estimateAcidityAdjustment(
  input: AcidityAdjustmentInput,
): AcidityAdjustmentResult {
  const acidulantStrengthPercent = input.acidulantStrengthPercent ?? 100;

  if (
    !Number.isFinite(input.currentMassKg) ||
    !Number.isFinite(input.currentAcidityPercent) ||
    !Number.isFinite(input.targetAcidityPercent) ||
    !Number.isFinite(acidulantStrengthPercent) ||
    input.currentMassKg <= 0 ||
    acidulantStrengthPercent <= 0
  ) {
    return {
      currentAcidKg: 0,
      acidToAddKg: null,
      finalAcidityPercent: null,
      assumption: "Adjustment assumes acid addition on a mass basis.",
      limitation:
        "Current mass, current acidity, target acidity, and acidulant strength must be valid positive numbers.",
    };
  }

  const currentAcidKg =
    input.currentMassKg * (input.currentAcidityPercent / 100);
  const targetAcidKg = input.currentMassKg * (input.targetAcidityPercent / 100);
  const acidGapKg = targetAcidKg - currentAcidKg;

  if (acidGapKg <= 0) {
    return {
      currentAcidKg: round(currentAcidKg),
      acidToAddKg: 0,
      finalAcidityPercent: round(input.currentAcidityPercent),
      assumption: `Acidulant strength assumed at ${acidulantStrengthPercent}% active acid.`,
      limitation:
        "Target acidity is not above the current acidity, so no acid addition is required.",
    };
  }

  return {
    currentAcidKg: round(currentAcidKg),
    acidToAddKg: round(acidGapKg / (acidulantStrengthPercent / 100)),
    finalAcidityPercent: round(input.targetAcidityPercent),
    assumption: `Acidulant strength assumed at ${acidulantStrengthPercent}% active acid.`,
  };
}

// Future extension: support acid dissociation models and pH buffering estimates.
