export type CostLineInput = {
  name?: string;
  massKg: number;
  pricePerKg: number;
};

export type CostEstimateResult = {
  totalCost: number;
  totalMassKg: number;
  costPerKg: number | null;
  breakdown: Array<{
    name: string;
    massKg: number;
    pricePerKg: number;
    lineCost: number;
  }>;
};

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

export function estimateFormulaCost(
  lines: CostLineInput[],
): CostEstimateResult {
  const breakdown = lines.map((line) => ({
    name: line.name ?? "Unnamed ingredient",
    massKg: round(Math.max(0, line.massKg)),
    pricePerKg: round(Math.max(0, line.pricePerKg)),
    lineCost: round(Math.max(0, line.massKg) * Math.max(0, line.pricePerKg)),
  }));

  const totalMassKg = breakdown.reduce((sum, line) => sum + line.massKg, 0);
  const totalCost = breakdown.reduce((sum, line) => sum + line.lineCost, 0);

  return {
    totalCost: round(totalCost),
    totalMassKg: round(totalMassKg),
    costPerKg: totalMassKg > 0 ? round(totalCost / totalMassKg) : null,
    breakdown,
  };
}

// Future extension: support FX conversion, supplier MOQs, and packaging cost adders.
