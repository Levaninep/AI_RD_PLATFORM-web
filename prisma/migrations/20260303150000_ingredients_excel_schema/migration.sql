DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Ingredient' AND column_name = 'pricePerKg'
  ) THEN
    ALTER TABLE "Ingredient" RENAME COLUMN "pricePerKg" TO "pricePerKgEur";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Ingredient' AND column_name = 'density'
  ) THEN
    ALTER TABLE "Ingredient" RENAME COLUMN "density" TO "densityKgPerL";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Ingredient' AND column_name = 'brix'
  ) THEN
    ALTER TABLE "Ingredient" RENAME COLUMN "brix" TO "brixPercent";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Ingredient' AND column_name = 'titratableAcidity'
  ) THEN
    ALTER TABLE "Ingredient" RENAME COLUMN "titratableAcidity" TO "titratableAcidityPercent";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Ingredient' AND column_name = 'waterContent'
  ) THEN
    ALTER TABLE "Ingredient" RENAME COLUMN "waterContent" TO "waterContentPercent";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'IngredientCategory' AND e.enumlabel = 'JuiceConcentrate'
  ) THEN
    ALTER TYPE "IngredientCategory" RENAME VALUE 'JuiceConcentrate' TO 'Juice';
  END IF;
END $$;

ALTER TABLE "Ingredient"
  ALTER COLUMN "ingredientName" SET NOT NULL,
  ALTER COLUMN "supplier" SET NOT NULL,
  ALTER COLUMN "countryOfOrigin" SET NOT NULL,
  ALTER COLUMN "pricePerKgEur" SET NOT NULL,
  ALTER COLUMN "co2SolubilityRelevant" SET DEFAULT false,
  ALTER COLUMN "vegan" SET DEFAULT false,
  ALTER COLUMN "natural" SET DEFAULT false,
  ALTER COLUMN "createdAt" SET DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS "Ingredient_ingredientName_key"
  ON "Ingredient"("ingredientName");

CREATE INDEX IF NOT EXISTS "Ingredient_ingredientName_idx"
  ON "Ingredient"("ingredientName");

CREATE INDEX IF NOT EXISTS "Ingredient_category_idx"
  ON "Ingredient"("category");

CREATE INDEX IF NOT EXISTS "Ingredient_updatedAt_idx"
  ON "Ingredient"("updatedAt");
