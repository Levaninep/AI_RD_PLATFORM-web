-- Create enums
CREATE TYPE "ShelfLifePackagingType" AS ENUM ('PET', 'GLASS', 'ALUMINUM_CAN', 'TETRA_PAK');
CREATE TYPE "ShelfLifeStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "ShelfLifeConditionType" AS ENUM ('REAL_TIME', 'ACCELERATED', 'LIGHT_CABINET', 'REFERENCE_2_5C', 'AGING_30C');
CREATE TYPE "SamplingEventType" AS ENUM ('ZERO', 'MID', 'FINAL', 'EXTRA');
CREATE TYPE "SamplingEventStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'SKIPPED');
CREATE TYPE "ParameterGroup" AS ENUM ('MICRO', 'PHYS_CHEM', 'CO2', 'MIGRATION', 'VISUAL', 'COATING');
CREATE TYPE "ParameterPassFail" AS ENUM ('PASS', 'FAIL', 'NOT_SET');

-- Shelf-life root test model
CREATE TABLE "ShelfLifeTest" (
  "id" TEXT NOT NULL,
  "testNumber" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "formulationId" TEXT,
  "packagingType" "ShelfLifePackagingType" NOT NULL,
  "packVolumeL" DOUBLE PRECISION NOT NULL,
  "carbonated" BOOLEAN NOT NULL DEFAULT false,
  "co2AtFilling" DOUBLE PRECISION,
  "plannedShelfLifeDays" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDatePlanned" TIMESTAMP(3),
  "status" "ShelfLifeStatus" NOT NULL DEFAULT 'PLANNED',
  "createdBy" TEXT,
  "responsiblePerson" TEXT,
  "approvedByNpd" TEXT,
  "approvedByNpdDate" TIMESTAMP(3),
  "approvedByQuality" TEXT,
  "approvedByQualityDate" TIMESTAMP(3),
  "reserveCoefficientEnabled" BOOLEAN NOT NULL DEFAULT false,
  "finalRecommendation" TEXT,
  "marketRequirements" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShelfLifeTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShelfLifeCondition" (
  "id" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "type" "ShelfLifeConditionType" NOT NULL,
  "temperatureC" DOUBLE PRECISION,
  "humidityPct" DOUBLE PRECISION,
  "lightLux" DOUBLE PRECISION,
  "wavelengthNmFrom" INTEGER,
  "wavelengthNmTo" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ShelfLifeCondition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SamplingEvent" (
  "id" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "conditionId" TEXT,
  "dayOffset" INTEGER NOT NULL,
  "plannedDate" TIMESTAMP(3) NOT NULL,
  "type" "SamplingEventType" NOT NULL,
  "requiredLiters" DOUBLE PRECISION NOT NULL,
  "requiredPacks" INTEGER NOT NULL,
  "status" "SamplingEventStatus" NOT NULL DEFAULT 'PLANNED',
  "sampleCode" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SamplingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestResult" (
  "id" TEXT NOT NULL,
  "samplingEventId" TEXT NOT NULL,
  "summaryStatus" TEXT,
  "deviationNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParameterResult" (
  "id" TEXT NOT NULL,
  "testResultId" TEXT NOT NULL,
  "group" "ParameterGroup" NOT NULL,
  "parameterKey" TEXT NOT NULL,
  "unit" TEXT,
  "normativeText" TEXT,
  "valueText" TEXT,
  "valueNumber" DOUBLE PRECISION,
  "passFail" "ParameterPassFail" NOT NULL DEFAULT 'NOT_SET',
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ParameterResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganolepticPanelistResult" (
  "id" TEXT NOT NULL,
  "testResultId" TEXT NOT NULL,
  "panelistCode" TEXT NOT NULL,
  "tasteScore" DOUBLE PRECISION,
  "smellScore" DOUBLE PRECISION,
  "colorScore" DOUBLE PRECISION,
  "homogeneityScore" DOUBLE PRECISION,
  "appearanceScore" DOUBLE PRECISION,
  "overallScore" DOUBLE PRECISION,
  "comments" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrganolepticPanelistResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CO2LossTest" (
  "id" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "productionLine" TEXT,
  "cappingQuality" TEXT,
  "openingTorque" DOUBLE PRECISION,
  "waterTempInPack" DOUBLE PRECISION,
  "co2DuringProduction" DOUBLE PRECISION,
  "co2After24h40C" DOUBLE PRECISION,
  "co2After48h40C" DOUBLE PRECISION,
  "co2After24h25C" DOUBLE PRECISION,
  "co2After48h25C" DOUBLE PRECISION,
  "generalComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CO2LossTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialsRequest" (
  "id" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "supplier" TEXT,
  "terms" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MaterialsRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialsRequestItem" (
  "id" TEXT NOT NULL,
  "materialsRequestId" TEXT NOT NULL,
  "ingredientName" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MaterialsRequestItem_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "ShelfLifeTest_testNumber_key" ON "ShelfLifeTest"("testNumber");
CREATE INDEX "ShelfLifeTest_status_idx" ON "ShelfLifeTest"("status");
CREATE INDEX "ShelfLifeTest_startDate_idx" ON "ShelfLifeTest"("startDate");
CREATE INDEX "ShelfLifeCondition_testId_idx" ON "ShelfLifeCondition"("testId");
CREATE INDEX "SamplingEvent_testId_plannedDate_idx" ON "SamplingEvent"("testId", "plannedDate");
CREATE INDEX "SamplingEvent_conditionId_idx" ON "SamplingEvent"("conditionId");
CREATE UNIQUE INDEX "TestResult_samplingEventId_key" ON "TestResult"("samplingEventId");
CREATE INDEX "ParameterResult_testResultId_group_idx" ON "ParameterResult"("testResultId", "group");
CREATE INDEX "OrganolepticPanelistResult_testResultId_idx" ON "OrganolepticPanelistResult"("testResultId");
CREATE INDEX "CO2LossTest_testId_idx" ON "CO2LossTest"("testId");
CREATE INDEX "MaterialsRequest_testId_idx" ON "MaterialsRequest"("testId");
CREATE INDEX "MaterialsRequestItem_materialsRequestId_idx" ON "MaterialsRequestItem"("materialsRequestId");

-- Foreign keys
ALTER TABLE "ShelfLifeTest"
  ADD CONSTRAINT "ShelfLifeTest_formulationId_fkey"
  FOREIGN KEY ("formulationId") REFERENCES "Formulation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShelfLifeCondition"
  ADD CONSTRAINT "ShelfLifeCondition_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "ShelfLifeTest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SamplingEvent"
  ADD CONSTRAINT "SamplingEvent_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "ShelfLifeTest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SamplingEvent"
  ADD CONSTRAINT "SamplingEvent_conditionId_fkey"
  FOREIGN KEY ("conditionId") REFERENCES "ShelfLifeCondition"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TestResult"
  ADD CONSTRAINT "TestResult_samplingEventId_fkey"
  FOREIGN KEY ("samplingEventId") REFERENCES "SamplingEvent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParameterResult"
  ADD CONSTRAINT "ParameterResult_testResultId_fkey"
  FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganolepticPanelistResult"
  ADD CONSTRAINT "OrganolepticPanelistResult_testResultId_fkey"
  FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CO2LossTest"
  ADD CONSTRAINT "CO2LossTest_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "ShelfLifeTest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaterialsRequest"
  ADD CONSTRAINT "MaterialsRequest_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "ShelfLifeTest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaterialsRequestItem"
  ADD CONSTRAINT "MaterialsRequestItem_materialsRequestId_fkey"
  FOREIGN KEY ("materialsRequestId") REFERENCES "MaterialsRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
