import {
  CO2_HENRY_DEFAULTS,
  CO2_INPUT_LIMITS,
  CO2_PHYSICS,
  WATER_VAPOR_ANTOINE,
} from "@/lib/constants/co2";

export type PressureType = "gauge" | "absolute";

export type CalculateCO2Input = {
  tempC: number;
  pressureBar: number;
  pressureType: PressureType;
  yCO2?: number;
  includeWaterVapor?: boolean;
  densityKgL?: number;
  henry?: {
    kH0?: number;
    A?: number;
    T0?: number;
  };
};

export type CalculateCO2Result = {
  co2_gL: number;
  debug: {
    T_K: number;
    kH: number;
    Pabs: number;
    pCO2: number;
    c_mol_per_kg: number;
    densityKgL: number;
    assumptions: string[];
  };
};

export type CO2CalculationErrorCode =
  | "INVALID_TEMPERATURE"
  | "INVALID_PRESSURE"
  | "INVALID_PRESSURE_TYPE"
  | "INVALID_HEADSPACE_FRACTION"
  | "INVALID_DENSITY"
  | "INVALID_HENRY_PARAMS";

export class CO2CalculationError extends Error {
  readonly code: CO2CalculationErrorCode;

  constructor(code: CO2CalculationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CO2CalculationError";
  }
}

export function calculateWaterVaporPressureBar(tempC: number): number {
  const saturationMmHg =
    10 **
    (WATER_VAPOR_ANTOINE.A -
      WATER_VAPOR_ANTOINE.B / (WATER_VAPOR_ANTOINE.C + tempC));

  return saturationMmHg * WATER_VAPOR_ANTOINE.mmHgToBar;
}

export function calculateHenryConstantMolPerKgBar(input: {
  tempC: number;
  kH0?: number;
  A?: number;
  T0?: number;
}): number {
  const { tempC } = input;
  const kH0 = input.kH0 ?? CO2_HENRY_DEFAULTS.kH0_mol_per_kg_bar;
  const A = input.A ?? CO2_HENRY_DEFAULTS.A_K;
  const T0 = input.T0 ?? CO2_HENRY_DEFAULTS.T0_K;

  if (!(kH0 > 0) || !(A > 0) || !(T0 > 0)) {
    throw new CO2CalculationError(
      "INVALID_HENRY_PARAMS",
      "Henry model settings must be positive numbers.",
    );
  }

  const T_K = tempC + 273.15;
  return kH0 * Math.exp(A * (1 / T_K - 1 / T0));
}

export function calculateCO2_gL(input: CalculateCO2Input): CalculateCO2Result {
  const {
    tempC,
    pressureBar,
    pressureType,
    includeWaterVapor = false,
    yCO2 = 1,
  } = input;

  if (pressureType !== "gauge" && pressureType !== "absolute") {
    throw new CO2CalculationError(
      "INVALID_PRESSURE_TYPE",
      "Pressure type must be Gauge or Absolute.",
    );
  }

  if (
    !Number.isFinite(tempC) ||
    tempC < CO2_INPUT_LIMITS.tempC.min ||
    tempC > CO2_INPUT_LIMITS.tempC.max
  ) {
    throw new CO2CalculationError(
      "INVALID_TEMPERATURE",
      `Temperature must be between ${CO2_INPUT_LIMITS.tempC.min} and ${CO2_INPUT_LIMITS.tempC.max} °C.`,
    );
  }

  if (!Number.isFinite(pressureBar)) {
    throw new CO2CalculationError(
      "INVALID_PRESSURE",
      "Pressure must be a valid number.",
    );
  }

  if (pressureType === "gauge" && pressureBar < 0) {
    throw new CO2CalculationError(
      "INVALID_PRESSURE",
      "Gauge pressure cannot be below 0 bar.",
    );
  }

  const Pabs =
    pressureType === "gauge"
      ? pressureBar + CO2_PHYSICS.ATM_PRESSURE_BAR
      : pressureBar;

  if (
    Pabs < CO2_INPUT_LIMITS.pressureAbsBar.min ||
    Pabs > CO2_INPUT_LIMITS.pressureAbsBar.max
  ) {
    throw new CO2CalculationError(
      "INVALID_PRESSURE",
      `Absolute pressure must be between ${CO2_INPUT_LIMITS.pressureAbsBar.min} and ${CO2_INPUT_LIMITS.pressureAbsBar.max} bar.`,
    );
  }

  if (
    !Number.isFinite(yCO2) ||
    yCO2 < CO2_INPUT_LIMITS.yCO2.min ||
    yCO2 > CO2_INPUT_LIMITS.yCO2.max
  ) {
    throw new CO2CalculationError(
      "INVALID_HEADSPACE_FRACTION",
      "Headspace CO₂ fraction must be between 0 and 1.",
    );
  }

  const densityKgL = input.densityKgL ?? CO2_INPUT_LIMITS.densityKgL.default;
  if (
    !Number.isFinite(densityKgL) ||
    densityKgL <= 0 ||
    densityKgL < CO2_INPUT_LIMITS.densityKgL.min ||
    densityKgL > CO2_INPUT_LIMITS.densityKgL.max
  ) {
    throw new CO2CalculationError(
      "INVALID_DENSITY",
      `Density must be between ${CO2_INPUT_LIMITS.densityKgL.min} and ${CO2_INPUT_LIMITS.densityKgL.max} kg/L.`,
    );
  }

  const T_K = tempC + 273.15;
  const kH = calculateHenryConstantMolPerKgBar({
    tempC,
    kH0: input.henry?.kH0,
    A: input.henry?.A,
    T0: input.henry?.T0,
  });

  const pH2O = includeWaterVapor ? calculateWaterVaporPressureBar(tempC) : 0;
  const dryGasPressure = Math.max(0, Pabs - pH2O);
  const pCO2 = Math.max(0, dryGasPressure * yCO2);

  const c_mol_per_kg = kH * pCO2;
  const co2_gL = c_mol_per_kg * CO2_PHYSICS.MW_CO2_g_per_mol * densityKgL;

  const assumptions = [
    `Headspace CO₂ fraction: ${yCO2.toFixed(3)}`,
    `Density: ${densityKgL.toFixed(3)} kg/L`,
    `Water vapor correction: ${includeWaterVapor ? "on" : "off"}`,
  ];

  return {
    co2_gL,
    debug: {
      T_K,
      kH,
      Pabs,
      pCO2,
      c_mol_per_kg,
      densityKgL,
      assumptions,
    },
  };
}
