export type IngredientRef = {
  id: string;
  name: string;
  category: string;
  density: number | null;
  brix: number | null;
  titratableAcidity: number | null;
};

export type Line = {
  ingredient: IngredientRef;
  amount: number;
  unit: "kg" | "g" | "L" | "mL";
};

export type Targets = {
  finalVolumeL: number;
  targetBrix: number;
  targetAcidity?: number | null;
  densityKgPerL?: number | null;
};

const WATER_DENSITY_KG_PER_L = 0.99717;

function normalizeDensity(input: number | null | undefined): number {
  if (input != null && Number.isFinite(input) && input > 0) {
    return input;
  }

  return 1.0;
}

function isSugar(ingredient: IngredientRef): boolean {
  const category = ingredient.category.toLowerCase();
  const name = ingredient.name.toLowerCase();
  return category.includes("sweet") || name.includes("sugar");
}

function isJuice(ingredient: IngredientRef): boolean {
  return ingredient.category.toLowerCase().includes("juice");
}

function isCitricAcid(ingredient: IngredientRef): boolean {
  const category = ingredient.category.toLowerCase();
  const name = ingredient.name.toLowerCase();
  return category.includes("acid") && name.includes("citric acid");
}

export function toMassKg(line: Line): number {
  const densityKgPerL = normalizeDensity(line.ingredient.density);

  if (line.unit === "kg") {
    return line.amount;
  }

  if (line.unit === "g") {
    return line.amount / 1000;
  }

  if (line.unit === "L") {
    return line.amount * densityKgPerL;
  }

  return (line.amount / 1000) * densityKgPerL;
}

export function toVolumeL(line: Line): number {
  const densityKgPerL = normalizeDensity(line.ingredient.density);
  const massKg = toMassKg(line);
  return massKg / densityKgPerL;
}

export function calcSpecs(lines: Line[], targets: Targets) {
  let sumMassKg = 0;
  let sumVolumeL = 0;
  let solidsKg = 0;
  let acidKg = 0;

  const missing = {
    brixJuices: [] as string[],
    acidityJuices: [] as string[],
    densityIngredients: [] as string[],
  };

  for (const line of lines) {
    const densityKgPerL = normalizeDensity(line.ingredient.density);
    const massKg = toMassKg(line);
    const volumeL = toVolumeL(line);

    if (line.ingredient.density == null) {
      missing.densityIngredients.push(line.ingredient.name);
    }

    sumMassKg += massKg;
    sumVolumeL += volumeL;

    if (isJuice(line.ingredient)) {
      if (
        line.ingredient.brix != null &&
        Number.isFinite(line.ingredient.brix)
      ) {
        solidsKg += massKg * (line.ingredient.brix / 100);
      } else {
        missing.brixJuices.push(line.ingredient.name);
      }

      if (
        line.ingredient.titratableAcidity != null &&
        Number.isFinite(line.ingredient.titratableAcidity)
      ) {
        acidKg += massKg * ((line.ingredient.titratableAcidity ?? 0) / 100);
      } else {
        missing.acidityJuices.push(line.ingredient.name);
      }
    } else if (isSugar(line.ingredient)) {
      solidsKg += massKg;
    } else if (isCitricAcid(line.ingredient)) {
      acidKg += massKg;
    }

    void densityKgPerL;
  }

  const waterToAddL = Math.max(0, targets.finalVolumeL - sumVolumeL);
  const waterToAddKg = waterToAddL * WATER_DENSITY_KG_PER_L;
  const finalVolumeL = sumVolumeL + waterToAddL;
  const finalMassKg = sumMassKg + waterToAddKg;

  const actualBrix = finalMassKg > 0 ? (solidsKg / finalMassKg) * 100 : 0;
  const actualAcidity = acidKg;

  const targetSolidsKg = finalMassKg * (targets.targetBrix / 100);
  const missingSolidsKg = targetSolidsKg - solidsKg;
  const suggestedSugarKg = Math.max(0, missingSolidsKg);

  const hasTargetAcidity =
    targets.targetAcidity != null && Number.isFinite(targets.targetAcidity);
  const targetAcidKg = hasTargetAcidity ? (targets.targetAcidity as number) : 0;
  const missingAcidKg = targetAcidKg - acidKg;
  const suggestedCitricKg = hasTargetAcidity
    ? Math.max(0, missingAcidKg)
    : undefined;

  const unique = (values: string[]) => [...new Set(values)];

  const warnings: string[] = [];
  const uniqueMissingDensity = unique(missing.densityIngredients);
  const uniqueMissingBrixJuices = unique(missing.brixJuices);
  const uniqueMissingAcidityJuices = unique(missing.acidityJuices);

  if (uniqueMissingDensity.length > 0) {
    warnings.push(
      `Density missing for: ${uniqueMissingDensity.join(", ")}. Defaulted to 1.0 kg/L.`,
    );
  }

  if (uniqueMissingBrixJuices.length > 0) {
    warnings.push(
      `Brix missing for juices: ${uniqueMissingBrixJuices.join(", ")}.`,
    );
  }

  if (uniqueMissingAcidityJuices.length > 0) {
    warnings.push(
      `Acidity missing for juices: ${uniqueMissingAcidityJuices.join(", ")}.`,
    );
  }

  return {
    totals: {
      sumMassKg,
      sumVolumeL,
      finalMassKg,
      finalVolumeL,
      solidsKg,
      acidKg,
    },
    actual: {
      brix: actualBrix,
      acidity: actualAcidity,
    },
    gaps: {
      brixDelta: actualBrix - targets.targetBrix,
      acidityDelta: hasTargetAcidity
        ? actualAcidity - (targets.targetAcidity as number)
        : undefined,
    },
    suggestions: {
      waterToAddL,
      waterToAddKg,
      sugarKg: suggestedSugarKg,
      citricKg: suggestedCitricKg,
    },
    warnings,
    missing: {
      brixJuices: uniqueMissingBrixJuices,
      acidityJuices: uniqueMissingAcidityJuices,
      densityIngredients: uniqueMissingDensity,
    },
  };
}
