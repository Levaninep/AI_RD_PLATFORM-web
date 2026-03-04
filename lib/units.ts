export type BatchSizeUnit = "kg" | "L";
export type DosageUnit = "g" | "kg" | "ml" | "L" | "%w/w";

export function toVolumeL(value: number, unit: DosageUnit): number | null {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  if (unit === "L") return value;
  if (unit === "ml") return value / 1000;
  return null;
}

export function toMassKgFromMassUnit(
  value: number,
  unit: DosageUnit,
): number | null {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  if (unit === "kg") return value;
  if (unit === "g") return value / 1000;
  return null;
}
