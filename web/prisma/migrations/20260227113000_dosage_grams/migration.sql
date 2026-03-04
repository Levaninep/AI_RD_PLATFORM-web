-- Rename legacy percentage column to dosageGrams for formulation item dosage storage
ALTER TABLE "FormulationIngredient"
RENAME COLUMN "percentage" TO "dosageGrams";
