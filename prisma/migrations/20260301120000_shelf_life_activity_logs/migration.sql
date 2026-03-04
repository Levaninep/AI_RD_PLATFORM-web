-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'GENERATE', 'RESULT_UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('SHELF_LIFE_TEST', 'SAMPLING_EVENT', 'TEST_RESULT');

-- CreateTable
CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "shelfLifeTestId" TEXT,
  "entityType" "ActivityEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" "ActivityAction" NOT NULL,
  "actorId" TEXT,
  "actorName" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_shelfLifeTestId_createdAt_idx" ON "ActivityLog"("shelfLifeTestId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActivityLog"
ADD CONSTRAINT "ActivityLog_shelfLifeTestId_fkey"
FOREIGN KEY ("shelfLifeTestId") REFERENCES "ShelfLifeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
