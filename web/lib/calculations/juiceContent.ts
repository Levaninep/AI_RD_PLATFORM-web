export type JuiceContentInput = {
  concentrateBrix: number;
  singleStrengthBrix: number;
  concentratePercent: number;
};

export type JuiceContentResult = {
  singleStrengthEquivalentPercent: number | null;
  concentrationFactor: number | null;
  limitation?: string;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function convertConcentrateToSingleStrength(
  input: JuiceContentInput,
): JuiceContentResult {
  if (
    !Number.isFinite(input.concentrateBrix) ||
    !Number.isFinite(input.singleStrengthBrix) ||
    !Number.isFinite(input.concentratePercent) ||
    input.concentrateBrix <= 0 ||
    input.singleStrengthBrix <= 0 ||
    input.concentratePercent < 0
  ) {
    return {
      singleStrengthEquivalentPercent: null,
      concentrationFactor: null,
      limitation:
        "Concentrate Brix, single-strength Brix, and dosage percent must be valid positive values.",
    };
  }

  const concentrationFactor = input.concentrateBrix / input.singleStrengthBrix;
  return {
    concentrationFactor: round(concentrationFactor),
    singleStrengthEquivalentPercent: round(
      input.concentratePercent * concentrationFactor,
    ),
  };
}

// Future extension: support juice content by legal category and fruit-specific defaults.
