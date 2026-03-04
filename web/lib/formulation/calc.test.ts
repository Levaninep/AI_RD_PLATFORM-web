import { describe, expect, it } from "vitest";
import { calculateFormulationMetrics } from "@/lib/formulation/calc";

describe("calculateFormulationMetrics", () => {
  it("calculates brix for juice concentrate + water", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 100,
      batchSizeUnit: "kg",
      lines: [
        {
          dosageValue: 20,
          dosageUnit: "kg",
          ingredient: {
            id: "jc",
            ingredientName: "Orange Juice Concentrate",
            densityKgPerL: 1.3,
            brixPercent: 65,
            titratableAcidityPercent: 3.5,
            pricePerKgEur: 1.8,
          },
        },
        {
          dosageValue: 80,
          dosageUnit: "kg",
          ingredient: {
            id: "w",
            ingredientName: "Water",
            densityKgPerL: 1,
            brixPercent: 0,
            titratableAcidityPercent: 0,
            pricePerKgEur: 0,
          },
        },
      ],
    });

    expect(result.finalBrixPercent).toBeCloseTo(13, 2);
    expect(result.status).toBe("partial");
  });

  it("calculates acidity increase for acid + juice blend", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 50,
      batchSizeUnit: "kg",
      lines: [
        {
          dosageValue: 10,
          dosageUnit: "kg",
          ingredient: {
            id: "juice",
            ingredientName: "Lemon Juice",
            densityKgPerL: 1.1,
            brixPercent: 10,
            titratableAcidityPercent: 5,
            pricePerKgEur: 1.5,
          },
        },
        {
          dosageValue: 1,
          dosageUnit: "kg",
          ingredient: {
            id: "acid",
            ingredientName: "Citric Acid",
            densityKgPerL: 1.66,
            brixPercent: 0,
            titratableAcidityPercent: 100,
            pricePerKgEur: 2.2,
          },
        },
      ],
    });

    expect(result.finalTitratableAcidityPercent).not.toBeNull();
    expect((result.finalTitratableAcidityPercent ?? 0) > 2).toBe(true);
  });

  it("returns partial with warning when density is missing for ml/L units", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 100,
      batchSizeUnit: "L",
      lines: [
        {
          dosageValue: 500,
          dosageUnit: "ml",
          ingredient: {
            id: "flavor",
            ingredientName: "Flavor",
            densityKgPerL: null,
            brixPercent: null,
            titratableAcidityPercent: null,
            pricePerKgEur: 10,
          },
        },
      ],
    });

    expect(result.status).toBe("partial");
    expect(
      result.warnings.some((item) => item.toLowerCase().includes("density")),
    ).toBe(true);
  });

  it("handles %w/w dosage against batch mass", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 100,
      batchSizeUnit: "kg",
      lines: [
        {
          dosageValue: 10,
          dosageUnit: "%w/w",
          ingredient: {
            id: "sugar",
            ingredientName: "Sugar",
            densityKgPerL: 1,
            brixPercent: 100,
            titratableAcidityPercent: 0,
            pricePerKgEur: 0.8,
          },
        },
      ],
    });

    const sugarLine = result.breakdown[0];
    expect(sugarLine.massKg).toBeCloseTo(10, 4);
    expect(result.totalCostEur).toBeCloseTo(8, 4);
  });

  it("calculates juice equivalent and total juice percent for multiple juices", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 1,
      batchSizeUnit: "kg",
      lines: [
        {
          dosageValue: 100,
          dosageUnit: "g",
          ingredient: {
            id: "apple",
            ingredientName: "Apple Juice Concentrate",
            category: "Juice",
            densityKgPerL: 1.347,
            brixPercent: 70,
            singleStrengthBrix: 11.5,
            titratableAcidityPercent: 0,
            pricePerKgEur: 0,
          },
        },
        {
          dosageValue: 20,
          dosageUnit: "g",
          ingredient: {
            id: "orange",
            ingredientName: "Orange Juice Concentrate",
            category: "Juice",
            densityKgPerL: 1.233,
            brixPercent: 50,
            singleStrengthBrix: 11.8,
            titratableAcidityPercent: 0,
            pricePerKgEur: 0,
          },
        },
      ],
    });

    expect(result.totalJuiceEquivalentKg).toBeCloseTo(0.6934, 3);
    expect(result.totalJuicePercent).toBe(69.3);
    expect(result.breakdown[0]?.juiceEquivalentKg).toBeCloseTo(0.6087, 3);
    expect(result.breakdown[1]?.juiceEquivalentKg).toBeCloseTo(0.0847, 3);
  });

  it("calculates juice equivalent for Juice category even when name has concentrate typo", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 1,
      batchSizeUnit: "kg",
      lines: [
        {
          dosageValue: 100,
          dosageUnit: "g",
          ingredient: {
            id: "orange-typo",
            ingredientName: "Orange Juice Concenrtrate",
            category: "Juice",
            densityKgPerL: 1.233,
            brixPercent: 50,
            singleStrengthBrix: 11.8,
            titratableAcidityPercent: 0,
            pricePerKgEur: 0,
          },
        },
      ],
    });

    expect(result.totalJuiceEquivalentKg).toBeCloseTo(0.4237, 3);
    expect(result.totalJuicePercent).toBe(42.4);
  });

  it("uses default water price when ingredient price is missing", () => {
    const result = calculateFormulationMetrics({
      batchSizeValue: 1,
      batchSizeUnit: "kg",
      lines: [
        {
          dosageValue: 1,
          dosageUnit: "kg",
          ingredient: {
            id: "water",
            ingredientName: "Water",
            category: "Juice",
            densityKgPerL: 1,
            brixPercent: 0,
            titratableAcidityPercent: 0,
            pricePerKgEur: null,
          },
        },
      ],
    });

    expect(result.totalCostEur).toBeCloseTo(0.00001, 8);
    expect(result.breakdown[0]?.pricePerKgEur).toBeCloseTo(0.00001, 8);
  });
});
