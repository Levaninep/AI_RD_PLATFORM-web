-- Add brix-density reference temperature to Ingredient
ALTER TABLE "Ingredient"
ADD COLUMN IF NOT EXISTS "brixDensityTempC" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- Create IngredientOverride table
CREATE TABLE IF NOT EXISTS "IngredientOverride" (
  "id" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "scopeType" TEXT NOT NULL,
  "scopeId" TEXT,
  "overridePricePerKgEur" DOUBLE PRECISION,
  "overrideDensityKgPerL" DOUBLE PRECISION,
  "overrideBrixPercent" DOUBLE PRECISION,
  "overrideTitratableAcidityPercent" DOUBLE PRECISION,
  "overridePH" DOUBLE PRECISION,
  "overrideWaterContentPercent" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IngredientOverride_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IngredientOverride_ingredientId_fkey'
  ) THEN
    ALTER TABLE "IngredientOverride"
    ADD CONSTRAINT "IngredientOverride_ingredientId_fkey"
    FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IngredientOverride_ingredientId_idx"
ON "IngredientOverride"("ingredientId");

CREATE INDEX IF NOT EXISTS "IngredientOverride_scopeType_scopeId_idx"
ON "IngredientOverride"("scopeType", "scopeId");

CREATE UNIQUE INDEX IF NOT EXISTS "IngredientOverride_ingredientId_scopeType_scopeId_key"
ON "IngredientOverride"("ingredientId", "scopeType", "scopeId");
