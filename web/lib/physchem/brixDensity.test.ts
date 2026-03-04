import { describe, expect, it } from "vitest";
import { brixFromDensity, densityFromBrix } from "@/lib/physchem/brixDensity";

describe("brixDensity", () => {
  it("returns out-of-range warning for invalid brix", () => {
    const result = densityFromBrix(90);
    expect(Number.isNaN(result.value)).toBe(true);
    expect(result.warnings).toContain("BRIX_OUT_OF_RANGE");
  });

  it("returns out-of-range warning for invalid density", () => {
    const result = brixFromDensity(1.6);
    expect(Number.isNaN(result.value)).toBe(true);
    expect(result.warnings).toContain("DENSITY_OUT_OF_RANGE");
  });

  it("inverts density to brix within tolerance", () => {
    const d = densityFromBrix(65);
    const b = brixFromDensity(d.value);

    expect(Math.abs(b.value - 65)).toBeLessThanOrEqual(0.3);
  });

  it("adds warning when temp is not 20C", () => {
    const result = densityFromBrix(50, 25);
    expect(result.warnings).toContain("TEMP_ASSUMED_20C");
  });
});
