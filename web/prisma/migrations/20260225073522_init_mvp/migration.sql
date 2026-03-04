-- CreateTable
CREATE TABLE "Formulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "volumeL" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormulationIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulationId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "gPerL" REAL NOT NULL,
    CONSTRAINT "FormulationIngredient_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormulationIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FormulationIngredient_formulationId_idx" ON "FormulationIngredient"("formulationId");

-- CreateIndex
CREATE INDEX "FormulationIngredient_ingredientId_idx" ON "FormulationIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "FormulationIngredient_formulationId_ingredientId_key" ON "FormulationIngredient"("formulationId", "ingredientId");
