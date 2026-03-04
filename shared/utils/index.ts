/**
 * Shared Utilities
 * Common utilities used across frontend and backend
 */

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Unexpected error occurred";
}

export async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function normalizeNumberInput(value: string): string {
  // allows "1", "1.", "1.2", also handles commas
  return value.replace(",", ".").trim();
}

export function buildPayloadOrThrow(form: {
  name: string;
  category: string;
  pricePerKg: string;
  supplier: string;
  density: string;
}) {
  const name = form.name.trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  if (name.length > 100) {
    throw new Error("Name must be under 100 characters.");
  }

  const category = (form.category || "Other").trim() || "Other";

  const priceStr = normalizeNumberInput(form.pricePerKg);
  const pricePerKg = Number(priceStr);
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
    throw new Error("Price per kg must be a valid number (0 or greater).");
  }

  const supplier = form.supplier.trim();
  const densityStr = normalizeNumberInput(form.density);
  const density = densityStr ? Number(densityStr) : null;

  if (density != null && (!Number.isFinite(density) || density <= 0)) {
    throw new Error("Density must be a valid number greater than 0.");
  }

  return {
    name,
    category,
    pricePerKg,
    supplier: supplier ? supplier : null,
    density,
  };
}
