export type Ingredient = {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  supplier?: string;
  density?: number; // optional, future use
  createdAt: string; // ISO string for UI simplicity
};
