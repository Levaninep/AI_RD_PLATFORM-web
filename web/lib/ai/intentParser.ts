import type { ChatIntent } from "@/types/chat";

export type ParsedIntent = {
  intent: ChatIntent;
  confidence: number;
  matchedKeywords: string[];
  needsTool: boolean;
};

const KEYWORDS: Array<{
  intent: ChatIntent;
  needsTool: boolean;
  keywords: string[];
}> = [
  {
    intent: "formula_comparison",
    needsTool: false,
    keywords: [
      "compare formula",
      "compare formulas",
      "difference between",
      "versus",
      "vs",
    ],
  },
  {
    intent: "ingredient_substitution",
    needsTool: false,
    keywords: [
      "substitute",
      "replace",
      "alternative",
      "swap ingredient",
      "replacement",
    ],
  },
  {
    intent: "product_idea",
    needsTool: false,
    keywords: [
      "product idea",
      "concept",
      "innovation",
      "new beverage",
      "prototype",
      "idea for",
    ],
  },
  {
    intent: "nutrition_calculation",
    needsTool: true,
    keywords: [
      "nutrition",
      "nutritional",
      "kcal",
      "calories",
      "sugar content",
      "protein",
      "per 100 ml",
    ],
  },
  {
    intent: "cost_calculation",
    needsTool: true,
    keywords: [
      "cost",
      "cogs",
      "price estimate",
      "cost estimate",
      "margin",
      "cost per kg",
    ],
  },
  {
    intent: "co2_calculation",
    needsTool: true,
    keywords: [
      "co2",
      "carbonation",
      "grams per liter",
      "g/l",
      "pressure",
      "henry",
    ],
  },
  {
    intent: "juice_content_calculation",
    needsTool: true,
    keywords: [
      "juice %",
      "juice percentage",
      "single-strength",
      "single strength",
      "concentrate",
      "reconstituted juice",
    ],
  },
  {
    intent: "dilution_calculation",
    needsTool: true,
    keywords: [
      "dilute",
      "dilution",
      "water needed",
      "water balance",
      "reconstitute",
      "top up",
    ],
  },
  {
    intent: "acidity_calculation",
    needsTool: true,
    keywords: [
      "acidity",
      "acid balance",
      "titratable acidity",
      "citric acid",
      "malic acid",
      "target acidity",
    ],
  },
  {
    intent: "brix_calculation",
    needsTool: true,
    keywords: [
      "brix",
      "bx",
      "sweetness balance",
      "target brix",
      "weighted brix",
    ],
  },
];

export function parseIntent(message: string): ParsedIntent {
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return {
      intent: "general_question",
      confidence: 0,
      matchedKeywords: [],
      needsTool: false,
    };
  }

  let bestMatch: ParsedIntent = {
    intent: "general_question",
    confidence: 0.25,
    matchedKeywords: [],
    needsTool: false,
  };

  for (const entry of KEYWORDS) {
    const matchedKeywords = entry.keywords.filter((keyword) =>
      normalized.includes(keyword),
    );

    if (matchedKeywords.length === 0) {
      continue;
    }

    const confidence = Math.min(0.98, 0.45 + matchedKeywords.length * 0.18);
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        intent: entry.intent,
        confidence,
        matchedKeywords,
        needsTool: entry.needsTool,
      };
    }
  }

  if (bestMatch.intent !== "general_question") {
    return bestMatch;
  }

  if (
    normalized.includes("how") ||
    normalized.includes("why") ||
    normalized.includes("what")
  ) {
    return {
      intent: "general_question",
      confidence: 0.52,
      matchedKeywords: [],
      needsTool: false,
    };
  }

  return bestMatch;
}
