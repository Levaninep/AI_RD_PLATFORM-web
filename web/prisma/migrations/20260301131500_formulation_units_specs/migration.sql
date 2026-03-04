-- AlterTable
ALTER TABLE "Ingredient"
ADD COLUMN "brix" DOUBLE PRECISION,
ADD COLUMN "titratableAcidity" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "FormulationIngredient"
ADD COLUMN "amount" DOUBLE PRECISION,
ADD COLUMN "unit" TEXT;

-- Backfill existing rows from dosageGrams defaults
UPDATE "FormulationIngredient"
SET "amount" = "dosageGrams", "unit" = 'g'
WHERE "amount" IS NULL OR "unit" IS NULL;
