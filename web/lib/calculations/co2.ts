import {
  calculateCO2_gL,
  type CalculateCO2Input,
  CO2CalculationError,
} from "@/lib/co2";

export type CO2EstimateResult = {
  co2GramsPerLiter: number | null;
  assumptions: string[];
  limitation?: string;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function estimateCarbonation(
  input: CalculateCO2Input,
): CO2EstimateResult {
  try {
    const result = calculateCO2_gL(input);
    return {
      co2GramsPerLiter: round(result.co2_gL),
      assumptions: result.debug.assumptions,
    };
  } catch (error) {
    if (error instanceof CO2CalculationError) {
      return {
        co2GramsPerLiter: null,
        assumptions: [],
        limitation: error.message,
      };
    }

    return {
      co2GramsPerLiter: null,
      assumptions: [],
      limitation: "Unable to calculate carbonation from the provided inputs.",
    };
  }
}

// Future extension: support inverse pressure lookup and packaged beverage headspace models.
