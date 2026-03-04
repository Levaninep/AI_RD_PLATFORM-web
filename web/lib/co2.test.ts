import { describe, expect, it } from "vitest";
import {
  CO2CalculationError,
  calculateCO2_gL,
  calculateHenryConstantMolPerKgBar,
} from "@/lib/co2";

describe("calculateCO2_gL", () => {
  it("decreases CO2 when temperature increases at fixed pressure", () => {
    const lowTemp = calculateCO2_gL({
      tempC: 4,
      pressureBar: 2.2,
      pressureType: "gauge",
    });

    const highTemp = calculateCO2_gL({
      tempC: 20,
      pressureBar: 2.2,
      pressureType: "gauge",
    });

    expect(lowTemp.co2_gL).toBeGreaterThan(highTemp.co2_gL);
  });

  it("increases CO2 when pressure increases at fixed temperature", () => {
    const lowPressure = calculateCO2_gL({
      tempC: 10,
      pressureBar: 1,
      pressureType: "gauge",
    });

    const highPressure = calculateCO2_gL({
      tempC: 10,
      pressureBar: 3,
      pressureType: "gauge",
    });

    expect(highPressure.co2_gL).toBeGreaterThan(lowPressure.co2_gL);
  });

  it("gauge numeric input yields higher CO2 than absolute numeric input", () => {
    const asGauge = calculateCO2_gL({
      tempC: 10,
      pressureBar: 2,
      pressureType: "gauge",
    });

    const asAbsolute = calculateCO2_gL({
      tempC: 10,
      pressureBar: 2,
      pressureType: "absolute",
    });

    expect(asGauge.co2_gL).toBeGreaterThan(asAbsolute.co2_gL);
  });

  it("returns 0 when yCO2 is 0", () => {
    const result = calculateCO2_gL({
      tempC: 10,
      pressureBar: 2,
      pressureType: "gauge",
      yCO2: 0,
    });

    expect(result.co2_gL).toBe(0);
    expect(result.debug.pCO2).toBe(0);
  });

  it("clamps pCO2 to non-negative with water vapor correction", () => {
    const result = calculateCO2_gL({
      tempC: 60,
      pressureBar: 0,
      pressureType: "absolute",
      yCO2: 1,
      includeWaterVapor: true,
    });

    expect(result.debug.pCO2).toBeGreaterThanOrEqual(0);
    expect(result.co2_gL).toBeGreaterThanOrEqual(0);
  });

  it("throws typed errors for invalid inputs", () => {
    expect(() =>
      calculateCO2_gL({
        tempC: -5,
        pressureBar: 2,
        pressureType: "gauge",
      }),
    ).toThrowError(CO2CalculationError);

    expect(() =>
      calculateCO2_gL({
        tempC: 10,
        pressureBar: -0.1,
        pressureType: "gauge",
      }),
    ).toThrowError(CO2CalculationError);

    expect(() =>
      calculateCO2_gL({
        tempC: 10,
        pressureBar: 2,
        pressureType: "absolute",
        yCO2: 2,
      }),
    ).toThrowError(CO2CalculationError);
  });
});

describe("calculateHenryConstantMolPerKgBar", () => {
  it("returns higher kH at lower temperature", () => {
    const cold = calculateHenryConstantMolPerKgBar({ tempC: 4 });
    const warm = calculateHenryConstantMolPerKgBar({ tempC: 25 });

    expect(cold).toBeGreaterThan(warm);
  });
});
