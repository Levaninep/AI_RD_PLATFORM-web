/*
  Warnings:

  - You are about to drop the column `volumeL` on the `Formulation` table. All the data in the column will be lost.
  - You are about to drop the column `gPerL` on the `FormulationIngredient` table. All the data in the column will be lost.
  - Added the required column `category` to the `Formulation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `percentage` to the `FormulationIngredient` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Formulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetBrix" REAL,
    "targetPH" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Formulation" ("createdAt", "id", "name", "notes", "updatedAt") SELECT "createdAt", "id", "name", "notes", "updatedAt" FROM "Formulation";
DROP TABLE "Formulation";
ALTER TABLE "new_Formulation" RENAME TO "Formulation";
CREATE TABLE "new_FormulationIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulationId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    CONSTRAINT "FormulationIngredient_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormulationIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FormulationIngredient" ("formulationId", "id", "ingredientId") SELECT "formulationId", "id", "ingredientId" FROM "FormulationIngredient";
DROP TABLE "FormulationIngredient";
ALTER TABLE "new_FormulationIngredient" RENAME TO "FormulationIngredient";
CREATE INDEX "FormulationIngredient_formulationId_idx" ON "FormulationIngredient"("formulationId");
CREATE INDEX "FormulationIngredient_ingredientId_idx" ON "FormulationIngredient"("ingredientId");
CREATE UNIQUE INDEX "FormulationIngredient_formulationId_ingredientId_key" ON "FormulationIngredient"("formulationId", "ingredientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
