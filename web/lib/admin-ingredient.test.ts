import { describe, expect, it } from "vitest";
import {
  adminIngredientInputSchema,
  adminIngredientQuerySchema,
  toDeleteBlockedMessage,
} from "@/lib/admin-ingredient";

describe("admin ingredient validation", () => {
  it("accepts a valid ingredient payload", () => {
    const parsed = adminIngredientInputSchema.safeParse({
      ingredientName: "Apple Juice Concentrate",
      category: "Juice",
      supplier: "Supplier A",
      countryOfOrigin: "GE",
      pricePerKgEur: 2.5,
      brixPercent: 70,
      singleStrengthBrix: 11.5,
      densityKgPerL: 1.347,
      vegan: true,
      natural: true,
      co2SolubilityRelevant: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects brix outside admin range", () => {
    const parsed = adminIngredientInputSchema.safeParse({
      ingredientName: "Bad Brix",
      category: "Juice",
      supplier: "Supplier A",
      countryOfOrigin: "GE",
      pricePerKgEur: 2.5,
      brixPercent: 90,
    });

    expect(parsed.success).toBe(false);
  });

  it("parses query with default sort and limit", () => {
    const parsed = adminIngredientQuerySchema.safeParse({
      q: "apple",
      limit: "20",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sortBy).toBe("updatedAt");
      expect(parsed.data.sortOrder).toBe("desc");
      expect(parsed.data.limit).toBe(20);
    }
  });
});

describe("delete safety message", () => {
  it("formats singular and plural correctly", () => {
    expect(toDeleteBlockedMessage(1)).toContain("1 formulation");
    expect(toDeleteBlockedMessage(3)).toContain("3 formulations");
  });
});
