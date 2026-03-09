import {
  estimateAcidityAdjustment,
  calculateWeightedAcidity,
} from "@/lib/calculations/acidity";
import {
  calculateWeightedBrix,
  estimateWaterForTargetBrix,
} from "@/lib/calculations/brix";
import { estimateCarbonation } from "@/lib/calculations/co2";
import { estimateFormulaCost } from "@/lib/calculations/cost";
import { computeDilution } from "@/lib/calculations/dilution";
import { convertConcentrateToSingleStrength } from "@/lib/calculations/juiceContent";
import { estimateNutrition } from "@/lib/calculations/nutrition";
import {
  searchFormulasByMessage,
  compareFormulas,
} from "@/lib/db/formulaService";
import { searchIngredientsByMessage } from "@/lib/db/ingredientService";
import type { ChatIntent, ChatToolName } from "@/types/chat";

export type ToolRouteResult = {
  toolUsed: ChatToolName | null;
  toolResult: unknown;
  assumptions: string[];
  needsMoreData?: boolean;
  knowledgeContext?: string;
};

export type KnowledgeContextResult = {
  context: string | null;
  matchedIngredientNames: string[];
  matchedFormulaNames: string[];
};

function extractAllNumbers(message: string): number[] {
  return [...message.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) =>
    Number(match[0]),
  );
}

function extractTaggedValues(message: string, pattern: RegExp): number[] {
  return [...message.matchAll(pattern)].map((match) => Number(match[1]));
}

function extractMassKgValues(message: string): number[] {
  return [
    ...message.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g|l|liters?|litres?|ml|mL)/gi),
  ].map((match) => {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === "kg") return value;
    if (unit === "g") return value / 1000;
    if (unit === "ml") return value / 1000;

    return value;
  });
}

function extractBrixValues(message: string): number[] {
  return extractTaggedValues(message, /(\d+(?:\.\d+)?)\s*(?:°?\s*brix|bx\b)/gi);
}

function extractPercentValues(message: string): number[] {
  return extractTaggedValues(message, /(\d+(?:\.\d+)?)\s*%/g);
}

function extractPressureBarValues(message: string): number[] {
  return extractTaggedValues(message, /(\d+(?:\.\d+)?)\s*bar/gi);
}

function extractTemperatureValues(message: string): number[] {
  return extractTaggedValues(message, /(-?\d+(?:\.\d+)?)\s*(?:°\s*c|\bc\b)/gi);
}

function formatJsonBlock(label: string, value: unknown) {
  return `${label}:\n${JSON.stringify(value, null, 2)}`;
}

function buildNeedsDataResult(
  toolUsed: ChatToolName,
  message: string,
  assumptions: string[],
): ToolRouteResult {
  return {
    toolUsed,
    toolResult: {
      status: "needs_more_data",
      message,
    },
    assumptions,
    needsMoreData: true,
  };
}

export async function buildKnowledgeContextFromMessage(
  message: string,
): Promise<KnowledgeContextResult> {
  const [ingredients, formulas] = await Promise.all([
    searchIngredientsByMessage(message, 4),
    searchFormulasByMessage(message, 3),
  ]);

  const parts: string[] = [];

  if (ingredients.length > 0) {
    parts.push(
      formatJsonBlock(
        "Matched platform ingredients",
        ingredients.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category,
          brix: ingredient.brix,
          acidity: ingredient.acidity,
          density: ingredient.density,
          pricePerKg: ingredient.pricePerKg,
          sugar: ingredient.sugar,
          kcal: ingredient.kcal,
          singleStrengthBrix: ingredient.singleStrengthBrix,
        })),
      ),
    );
  }

  if (formulas.length > 0) {
    parts.push(
      formatJsonBlock(
        "Matched saved formulas",
        formulas.map((formula) => ({
          id: formula.id,
          name: formula.name,
          category: formula.category,
          targetBrix: formula.targetBrix,
          targetPH: formula.targetPH,
          co2GPerL: formula.co2GPerL,
          ingredientCount: formula.ingredients.length,
        })),
      ),
    );
  }

  return {
    context: parts.length > 0 ? parts.join("\n\n") : null,
    matchedIngredientNames: ingredients.map((item) => item.name),
    matchedFormulaNames: formulas.map((item) => item.name),
  };
}

export async function routeIntentToTool(input: {
  intent: ChatIntent;
  message: string;
}): Promise<ToolRouteResult | null> {
  const formulas = await searchFormulasByMessage(input.message, 3);
  const primaryFormula = formulas[0] ?? null;
  const matchedIngredients = await searchIngredientsByMessage(input.message, 4);
  const assumptions: string[] = [];

  if (input.intent === "formula_comparison" && formulas.length >= 2) {
    const comparison = await compareFormulas(formulas[0].id, formulas[1].id);
    if (!comparison) {
      return null;
    }

    return {
      toolUsed: "formula_knowledge",
      toolResult: comparison,
      assumptions: [
        "Comparison is based on the saved formulas currently available in the platform.",
      ],
    };
  }

  if (input.intent === "brix_calculation") {
    if (primaryFormula) {
      const result = calculateWeightedBrix(
        primaryFormula.ingredients.map((line) => ({
          name: line.ingredient.name,
          massKg: line.dosageGrams / 1000,
          brixPercent: line.ingredient.brix,
        })),
      );
      const targetBrix = extractBrixValues(input.message)[0] ?? null;
      const adjustment =
        targetBrix != null && result.weightedBrixPercent != null
          ? estimateWaterForTargetBrix({
              currentMassKg: result.totalMassKg,
              currentBrixPercent: result.weightedBrixPercent,
              targetBrixPercent: targetBrix,
            })
          : null;

      assumptions.push(
        `Formula ${primaryFormula.name} was used from saved platform data.`,
      );
      return {
        toolUsed: "brix",
        toolResult: {
          formulaName: primaryFormula.name,
          weighted: result,
          adjustment,
        },
        assumptions,
      };
    }

    const brixValues = extractBrixValues(input.message);
    const massValues = extractMassKgValues(input.message);
    if (brixValues.length >= 2 && massValues.length >= 1) {
      return {
        toolUsed: "brix",
        toolResult: estimateWaterForTargetBrix({
          currentMassKg: massValues[0],
          currentBrixPercent: brixValues[0],
          targetBrixPercent: brixValues[1],
        }),
        assumptions: [
          "Mass input is interpreted on a water-like mass basis when volume units are used.",
        ],
      };
    }

    return buildNeedsDataResult(
      "brix",
      "Provide a current mass or volume plus current and target Brix values, or mention a saved formula by name.",
      assumptions,
    );
  }

  if (input.intent === "acidity_calculation") {
    if (primaryFormula) {
      const result = calculateWeightedAcidity(
        primaryFormula.ingredients.map((line) => ({
          name: line.ingredient.name,
          massKg: line.dosageGrams / 1000,
          acidityPercent: line.ingredient.acidity,
        })),
      );
      assumptions.push(
        `Formula ${primaryFormula.name} was used from saved platform data.`,
      );
      return {
        toolUsed: "acidity",
        toolResult: {
          formulaName: primaryFormula.name,
          weighted: result,
        },
        assumptions,
      };
    }

    const percentages = extractPercentValues(input.message);
    const massValues = extractMassKgValues(input.message);
    if (percentages.length >= 2 && massValues.length >= 1) {
      return {
        toolUsed: "acidity",
        toolResult: estimateAcidityAdjustment({
          currentMassKg: massValues[0],
          currentAcidityPercent: percentages[0],
          targetAcidityPercent: percentages[1],
        }),
        assumptions: [
          "Acidity is treated as a mass percentage and acidulant strength defaults to 100% unless specified.",
        ],
      };
    }

    return buildNeedsDataResult(
      "acidity",
      "Provide current batch mass plus current and target acidity values, or mention a saved formula by name.",
      assumptions,
    );
  }

  if (input.intent === "juice_content_calculation") {
    if (primaryFormula) {
      const totalMassKg = primaryFormula.ingredients.reduce(
        (sum, line) => sum + line.dosageGrams / 1000,
        0,
      );
      const juiceLines = primaryFormula.ingredients
        .filter(
          (line) => line.ingredient.singleStrengthBrix && line.ingredient.brix,
        )
        .map((line) => ({
          ingredient: line.ingredient.name,
          result: convertConcentrateToSingleStrength({
            concentrateBrix: line.ingredient.brix ?? 0,
            singleStrengthBrix: line.ingredient.singleStrengthBrix ?? 0,
            concentratePercent:
              totalMassKg > 0
                ? (line.dosageGrams / 1000 / totalMassKg) * 100
                : 0,
          }),
        }));

      return {
        toolUsed: "juice_content",
        toolResult: {
          formulaName: primaryFormula.name,
          juiceLines,
          totalSingleStrengthPercent: Number(
            juiceLines
              .reduce(
                (sum, line) =>
                  sum + (line.result.singleStrengthEquivalentPercent ?? 0),
                0,
              )
              .toFixed(4),
          ),
        },
        assumptions: [
          "Single-strength juice equivalent is estimated from concentrate Brix divided by single-strength Brix.",
        ],
      };
    }

    const brixValues = extractBrixValues(input.message);
    const percentages = extractPercentValues(input.message);
    if (brixValues.length >= 2 && percentages.length >= 1) {
      return {
        toolUsed: "juice_content",
        toolResult: convertConcentrateToSingleStrength({
          concentrateBrix: brixValues[0],
          singleStrengthBrix: brixValues[1],
          concentratePercent: percentages[0],
        }),
        assumptions: [
          "Dosage percentage is assumed to be the concentrate percentage in the finished beverage.",
        ],
      };
    }

    const ingredient = matchedIngredients.find(
      (item) => item.singleStrengthBrix != null && item.brix != null,
    );
    if (ingredient && percentages.length >= 1) {
      return {
        toolUsed: "juice_content",
        toolResult: {
          ingredient: ingredient.name,
          ...convertConcentrateToSingleStrength({
            concentrateBrix: ingredient.brix ?? 0,
            singleStrengthBrix: ingredient.singleStrengthBrix ?? 0,
            concentratePercent: percentages[0],
          }),
        },
        assumptions: [
          `Ingredient ${ingredient.name} was matched from platform data.`,
        ],
      };
    }

    return buildNeedsDataResult(
      "juice_content",
      "Provide concentrate Brix, single-strength Brix, and dosage percentage, or mention a saved formula or concentrate ingredient name.",
      assumptions,
    );
  }

  if (input.intent === "dilution_calculation") {
    if (primaryFormula) {
      const weighted = calculateWeightedBrix(
        primaryFormula.ingredients.map((line) => ({
          name: line.ingredient.name,
          massKg: line.dosageGrams / 1000,
          brixPercent: line.ingredient.brix,
        })),
      );
      const targetBrix =
        extractBrixValues(input.message)[0] ?? primaryFormula.targetBrix;

      return {
        toolUsed: "dilution",
        toolResult:
          weighted.weightedBrixPercent != null && targetBrix != null
            ? computeDilution({
                solidsKg: weighted.totalSolidsKg,
                currentMassKg: weighted.totalMassKg,
                targetSolidsPercent: targetBrix,
              })
            : {
                status: "needs_more_data",
                message:
                  "Target Brix is needed to calculate dilution for the saved formula.",
              },
        assumptions: [
          `Formula ${primaryFormula.name} was used from saved platform data.`,
        ],
      };
    }

    const brixValues = extractBrixValues(input.message);
    const massValues = extractMassKgValues(input.message);
    if (brixValues.length >= 2 && massValues.length >= 1) {
      const solidsKg = massValues[0] * (brixValues[0] / 100);
      return {
        toolUsed: "dilution",
        toolResult: computeDilution({
          solidsKg,
          currentMassKg: massValues[0],
          targetSolidsPercent: brixValues[1],
        }),
        assumptions: [
          "Brix is treated as soluble solids percent on a mass basis.",
        ],
      };
    }

    return buildNeedsDataResult(
      "dilution",
      "Provide current mass, current Brix, and target Brix, or mention a saved formula by name.",
      assumptions,
    );
  }

  if (input.intent === "co2_calculation") {
    const pressureBar =
      extractPressureBarValues(input.message)[0] ??
      extractAllNumbers(input.message)[0];
    const tempC = extractTemperatureValues(input.message)[0] ?? 20;
    if (pressureBar == null) {
      return buildNeedsDataResult(
        "co2",
        "Provide at least pressure in bar. Temperature defaults to 20 C if not specified.",
        assumptions,
      );
    }

    const pressureType = input.message.toLowerCase().includes("absolute")
      ? "absolute"
      : "gauge";

    return {
      toolUsed: "co2",
      toolResult: estimateCarbonation({
        pressureBar,
        tempC,
        pressureType,
      }),
      assumptions: [
        `Pressure type was interpreted as ${pressureType}.`,
        tempC === 20
          ? "Temperature defaulted to 20 C because it was not explicitly provided."
          : "Temperature was parsed from the user message.",
      ],
    };
  }

  if (input.intent === "cost_calculation") {
    if (primaryFormula) {
      return {
        toolUsed: "cost",
        toolResult: estimateFormulaCost(
          primaryFormula.ingredients.map((line) => ({
            name: line.ingredient.name,
            massKg: line.dosageGrams / 1000,
            pricePerKg:
              line.priceOverridePerKg ?? line.ingredient.pricePerKg ?? 0,
          })),
        ),
        assumptions: [
          `Formula ${primaryFormula.name} was used from saved platform data.`,
        ],
      };
    }

    return buildNeedsDataResult(
      "cost",
      "Mention a saved formula name for cost estimation, or provide ingredient mass and price inputs in a future structured format.",
      assumptions,
    );
  }

  if (input.intent === "nutrition_calculation") {
    if (primaryFormula) {
      return {
        toolUsed: "nutrition",
        toolResult: {
          formulaName: primaryFormula.name,
          ...estimateNutrition(
            primaryFormula.ingredients.map((line) => ({
              name: line.ingredient.name,
              massKg: line.dosageGrams / 1000,
              energyKcal: line.ingredient.kcal,
              carbohydrates: line.ingredient.carbohydrates,
              sugars: line.ingredient.sugars,
              protein: line.ingredient.protein,
              fat: line.ingredient.fat,
              salt: line.ingredient.salt,
            })),
          ),
        },
        assumptions: [
          `Formula ${primaryFormula.name} was used from saved platform data.`,
        ],
      };
    }

    return buildNeedsDataResult(
      "nutrition",
      "Mention a saved formula name to estimate nutrition from platform ingredient data.",
      assumptions,
    );
  }

  return null;
}
