/**
 * Shared Types
 * Types used across frontend and backend
 */

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  supplier: string | null;
  density: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Formulation = {
  id: string;
  name: string;
  volumeL: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: FormulationIngredient[];
};

export type FormulationIngredient = {
  id: string;
  formulationId: string;
  ingredientId: string;
  gPerL: number;
  formulation?: Formulation;
  ingredient?: Ingredient;
};

export type ApiError = {
  error?: {
    message?: string;
  };
};

export type FormState = {
  name: string;
  category: string;
  pricePerKg: string;
  supplier: string;
  density: string;
};
