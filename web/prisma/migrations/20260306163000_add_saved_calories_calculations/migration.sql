CREATE TABLE "SavedCaloriesCalculation" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "formulationId" TEXT NOT NULL,
  "formulationName" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedCaloriesCalculation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedCaloriesCalculation_userId_idx" ON "SavedCaloriesCalculation"("userId");
CREATE INDEX "SavedCaloriesCalculation_formulationId_idx" ON "SavedCaloriesCalculation"("formulationId");
CREATE INDEX "SavedCaloriesCalculation_createdAt_idx" ON "SavedCaloriesCalculation"("createdAt");

ALTER TABLE "SavedCaloriesCalculation"
ADD CONSTRAINT "SavedCaloriesCalculation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SavedCaloriesCalculation"
ADD CONSTRAINT "SavedCaloriesCalculation_formulationId_fkey"
FOREIGN KEY ("formulationId") REFERENCES "Formulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
