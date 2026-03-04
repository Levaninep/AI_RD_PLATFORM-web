import { describe, expect, it } from "vitest";
import {
  chooseOverrideByPriority,
  resolveEffectiveFromOverride,
} from "@/lib/ingredient-override-priority";

describe("ingredient override priority", () => {
  it("prefers formulation override over project and global", () => {
    const choice = chooseOverrideByPriority({
      formulation: { id: "f" },
      project: { id: "p" },
      global: { id: "g" },
    });

    expect(choice?.id).toBe("f");
  });

  it("falls back to project then global", () => {
    const projectChoice = chooseOverrideByPriority({
      formulation: null,
      project: { id: "p" },
      global: { id: "g" },
    });
    const globalChoice = chooseOverrideByPriority({
      formulation: null,
      project: null,
      global: { id: "g" },
    });

    expect(projectChoice?.id).toBe("p");
    expect(globalChoice?.id).toBe("g");
  });

  it("uses override values and tracks source labels", () => {
    const result = resolveEffectiveFromOverride(
      {
        pricePerKgEur: 2,
        densityKgPerL: 1.1,
        brixPercent: 30,
        titratableAcidityPercent: 1,
        pH: 3.4,
        waterContentPercent: 70,
      },
      {
        id: "ovr",
        overridePricePerKgEur: null,
        overrideDensityKgPerL: 1.2,
        overrideBrixPercent: 45,
        overrideTitratableAcidityPercent: null,
        overridePH: null,
        overrideWaterContentPercent: 65,
      },
    );

    expect(result.effectivePricePerKgEur).toBe(2);
    expect(result.effectiveDensityKgPerL).toBe(1.2);
    expect(result.effectiveBrixPercent).toBe(45);
    expect(result.sources.densityKgPerL).toBe("overridden");
    expect(result.sources.pricePerKgEur).toBe("database");
  });
});
