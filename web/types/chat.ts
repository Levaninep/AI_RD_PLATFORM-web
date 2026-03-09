export type ChatRole = "user" | "assistant";

export type ChatIntent =
  | "general_question"
  | "brix_calculation"
  | "acidity_calculation"
  | "juice_content_calculation"
  | "dilution_calculation"
  | "co2_calculation"
  | "cost_calculation"
  | "nutrition_calculation"
  | "product_idea"
  | "ingredient_substitution"
  | "formula_comparison";

export type ChatToolName =
  | "brix"
  | "acidity"
  | "juice_content"
  | "dilution"
  | "co2"
  | "cost"
  | "nutrition"
  | "formula_knowledge"
  | null;

export type ChatResponseMetadata = {
  intent: ChatIntent;
  toolUsed: ChatToolName;
};

export type ChatMessage = {
  role: ChatRole;
  content: string;
  metadata?: ChatResponseMetadata;
};

export type ChatRequestBody = {
  messages: ChatMessage[];
};

export type ChatResponseBody = {
  reply: string;
  metadata?: ChatResponseMetadata;
};

export type ChatErrorBody = {
  error?:
    | string
    | {
        code?: string;
        message?: string;
      };
};

export type ChatStatusResponseBody = {
  available: boolean;
  reason: string | null;
};
