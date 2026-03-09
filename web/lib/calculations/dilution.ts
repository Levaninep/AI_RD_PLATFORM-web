export type DilutionInput = {
  solidsKg: number;
  currentMassKg: number;
  targetSolidsPercent: number;
};

export type DilutionResult = {
  requiredFinalMassKg: number | null;
  waterToAddKg: number | null;
  resultingSolidsPercent: number | null;
  limitation?: string;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function computeDilution(input: DilutionInput): DilutionResult {
  if (
    !Number.isFinite(input.solidsKg) ||
    !Number.isFinite(input.currentMassKg) ||
    !Number.isFinite(input.targetSolidsPercent) ||
    input.solidsKg < 0 ||
    input.currentMassKg <= 0 ||
    input.targetSolidsPercent <= 0 ||
    input.targetSolidsPercent >= 100
  ) {
    return {
      requiredFinalMassKg: null,
      waterToAddKg: null,
      resultingSolidsPercent: null,
      limitation:
        "Solids, current mass, and target solids percent must be valid, with target solids below 100%.",
    };
  }

  const requiredFinalMassKg =
    input.solidsKg / (input.targetSolidsPercent / 100);
  const waterToAddKg = requiredFinalMassKg - input.currentMassKg;

  return {
    requiredFinalMassKg: round(requiredFinalMassKg),
    waterToAddKg: round(waterToAddKg),
    resultingSolidsPercent: round(input.targetSolidsPercent),
  };
}

// Future extension: support density-aware volume-based dilution for concentrates and syrups.
