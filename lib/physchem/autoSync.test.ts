import { describe, expect, it } from "vitest";
import { applyAutoSync } from "@/lib/physchem/autoSync";

describe("autoSync", () => {
  it("updates density when brix is edited", () => {
    const next = applyAutoSync({
      state: { brixPercent: "", densityKgPerL: "", lastEditedField: null },
      editedField: "brix",
      nextRawValue: "50",
      autoCalculate: true,
    });

    expect(next.lastEditedField).toBe("brix");
    expect(next.densityKgPerL).not.toBe("");
  });

  it("updates brix when density is edited", () => {
    const next = applyAutoSync({
      state: { brixPercent: "", densityKgPerL: "", lastEditedField: null },
      editedField: "density",
      nextRawValue: "1.233",
      autoCalculate: true,
    });

    expect(next.lastEditedField).toBe("density");
    expect(next.brixPercent).not.toBe("");
  });

  it("does not mutate opposite field when auto-calc is off", () => {
    const next = applyAutoSync({
      state: {
        brixPercent: "10",
        densityKgPerL: "1.04",
        lastEditedField: null,
      },
      editedField: "brix",
      nextRawValue: "12",
      autoCalculate: false,
    });

    expect(next.brixPercent).toBe("12");
    expect(next.densityKgPerL).toBe("1.04");
  });
});
