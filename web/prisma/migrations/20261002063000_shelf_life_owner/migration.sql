ALTER TABLE "ShelfLifeTest" ADD COLUMN "ownerId" TEXT;

CREATE INDEX "ShelfLifeTest_ownerId_idx" ON "ShelfLifeTest"("ownerId");

ALTER TABLE "ShelfLifeTest"
ADD CONSTRAINT "ShelfLifeTest_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
