export type IngredientNutritionEstimate = {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturates: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
  nutritionBasis: "PER_100G" | "PER_100ML";
};

function round(value: number): number {
  return Number(value.toFixed(2));
}

export function estimateIngredientNutrition(input: {
  ingredientName: string;
  category?: string | null;
  brixPercent?: number | null;
}): IngredientNutritionEstimate {
  const name = input.ingredientName.trim().toLowerCase();
  const category = (input.category ?? "").trim().toLowerCase();
  const brix = input.brixPercent ?? null;

  if (name === "water") {
    return {
      energyKcal: 0,
      energyKj: 0,
      fat: 0,
      saturates: 0,
      carbohydrates: 0,
      sugars: 0,
      protein: 0,
      salt: 0,
      nutritionBasis: "PER_100G",
    };
  }

  if (
    category === "sweetener" ||
    name.includes("sugar") ||
    name.includes("syrup") ||
    name.includes("agave")
  ) {
    const carbs = Math.max(0, Math.min(100, brix ?? 100));
    const sugars = Math.max(0, Math.min(carbs, carbs * 0.98));
    const kcal = carbs * 4;
    return {
      energyKcal: round(kcal),
      energyKj: round(kcal * 4.184),
      fat: 0,
      saturates: 0,
      carbohydrates: round(carbs),
      sugars: round(sugars),
      protein: 0,
      salt: 0,
      nutritionBasis: "PER_100G",
    };
  }

  if (
    name.includes("concentrate") ||
    (category === "juice" && (brix ?? 0) >= 35)
  ) {
    const carbs = Math.max(0, Math.min(85, brix ?? 65));
    const sugars = Math.max(0, Math.min(carbs, carbs * 0.9));
    const protein = 0.3;
    const fat = 0.1;
    const kcal = carbs * 4 + protein * 4 + fat * 9;
    return {
      energyKcal: round(kcal),
      energyKj: round(kcal * 4.184),
      fat: round(fat),
      saturates: 0.02,
      carbohydrates: round(carbs),
      sugars: round(sugars),
      protein: round(protein),
      salt: 0.01,
      nutritionBasis: "PER_100G",
    };
  }

  if (name.includes("puree") || name.includes("purée")) {
    const carbs = Math.max(0, Math.min(35, (brix ?? 20) * 0.85));
    const sugars = Math.max(0, Math.min(carbs, carbs * 0.8));
    const protein = 0.4;
    const fat = 0.2;
    const kcal = carbs * 4 + protein * 4 + fat * 9;
    return {
      energyKcal: round(kcal),
      energyKj: round(kcal * 4.184),
      fat: round(fat),
      saturates: 0.03,
      carbohydrates: round(carbs),
      sugars: round(sugars),
      protein: round(protein),
      salt: 0.01,
      nutritionBasis: "PER_100G",
    };
  }

  return {
    energyKcal: 0,
    energyKj: 0,
    fat: 0,
    saturates: 0,
    carbohydrates: 0,
    sugars: 0,
    protein: 0,
    salt: 0,
    nutritionBasis: "PER_100G",
  };
}
