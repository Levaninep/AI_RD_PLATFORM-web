import { brixFromDensity, densityFromBrix } from "@/lib/physchem/brixDensity";

export type AutoSyncState = {
  brixPercent: string;
  densityKgPerL: string;
  lastEditedField: "brix" | "density" | null;
};

function parseOptional(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function applyAutoSync(input: {
  state: AutoSyncState;
  editedField: "brix" | "density";
  nextRawValue: string;
  autoCalculate: boolean;
}) {
  const next: AutoSyncState = {
    ...input.state,
    lastEditedField: input.editedField,
    ...(input.editedField === "brix"
      ? { brixPercent: input.nextRawValue }
      : { densityKgPerL: input.nextRawValue }),
  };

  if (!input.autoCalculate) {
    return next;
  }

  if (input.editedField === "brix") {
    const brix = parseOptional(input.nextRawValue);
    if (brix == null) {
      return { ...next, densityKgPerL: "" };
    }

    const density = densityFromBrix(brix, 20);
    if (!Number.isFinite(density.value)) {
      return next;
    }

    return {
      ...next,
      densityKgPerL: String(density.value),
    };
  }

  const density = parseOptional(input.nextRawValue);
  if (density == null) {
    return { ...next, brixPercent: "" };
  }

  const brix = brixFromDensity(density, 20);
  if (!Number.isFinite(brix.value)) {
    return next;
  }

  return {
    ...next,
    brixPercent: String(brix.value),
  };
}
