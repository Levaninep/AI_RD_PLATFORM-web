import { describe, expect, it } from "vitest";
import {
  WATER_BASE_PRICE_PER_KG,
  calculateFormulationBatchCost,
  resolveBasePricePerKg,
} from "@/lib/formulation";

describe("formulation pricing defaults", () => {
  it("resolves water base price to default when no explicit price exists", () => {
    const resolved = resolveBasePricePerKg({ ingredientName: "Water" });

    expect(resolved).toBe(WATER_BASE_PRICE_PER_KG);
  });

  it("applies water default in batch cost totals", () => {
    const result = calculateFormulationBatchCost([
      {
        dosageGrams: 1000,
        ingredient: {
          ingredientName: "Water",
          pricePerKgEur: null,
          pricePerKg: null,
        },
      },
    ]);

    expect(result.totalCostUSD).toBeCloseTo(WATER_BASE_PRICE_PER_KG, 8);
    expect(result.costPerKgUSD).toBeCloseTo(WATER_BASE_PRICE_PER_KG, 8);
  });
});
