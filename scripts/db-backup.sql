--
-- PostgreSQL database dump
--

\restrict Ra4WXENduyUwgrAMMbaEIaLKIlcOZrjndcU6xyu66IfAxljtWkcve16MayoBimo

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."TestResult" DROP CONSTRAINT IF EXISTS "TestResult_samplingEventId_fkey";
ALTER TABLE IF EXISTS ONLY public."ShelfLifeTest" DROP CONSTRAINT IF EXISTS "ShelfLifeTest_formulationId_fkey";
ALTER TABLE IF EXISTS ONLY public."ShelfLifeCondition" DROP CONSTRAINT IF EXISTS "ShelfLifeCondition_testId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedCaloriesCalculation" DROP CONSTRAINT IF EXISTS "SavedCaloriesCalculation_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."SavedCaloriesCalculation" DROP CONSTRAINT IF EXISTS "SavedCaloriesCalculation_formulationId_fkey";
ALTER TABLE IF EXISTS ONLY public."SamplingEvent" DROP CONSTRAINT IF EXISTS "SamplingEvent_testId_fkey";
ALTER TABLE IF EXISTS ONLY public."SamplingEvent" DROP CONSTRAINT IF EXISTS "SamplingEvent_conditionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ParameterResult" DROP CONSTRAINT IF EXISTS "ParameterResult_testResultId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrganolepticPanelistResult" DROP CONSTRAINT IF EXISTS "OrganolepticPanelistResult_testResultId_fkey";
ALTER TABLE IF EXISTS ONLY public."MaterialsRequest" DROP CONSTRAINT IF EXISTS "MaterialsRequest_testId_fkey";
ALTER TABLE IF EXISTS ONLY public."MaterialsRequestItem" DROP CONSTRAINT IF EXISTS "MaterialsRequestItem_materialsRequestId_fkey";
ALTER TABLE IF EXISTS ONLY public."IngredientOverride" DROP CONSTRAINT IF EXISTS "IngredientOverride_ingredientId_fkey";
ALTER TABLE IF EXISTS ONLY public."Formulation" DROP CONSTRAINT IF EXISTS "Formulation_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."FormulationIngredient" DROP CONSTRAINT IF EXISTS "FormulationIngredient_ingredientId_fkey";
ALTER TABLE IF EXISTS ONLY public."FormulationIngredient" DROP CONSTRAINT IF EXISTS "FormulationIngredient_formulationId_fkey";
ALTER TABLE IF EXISTS ONLY public."CO2LossTest" DROP CONSTRAINT IF EXISTS "CO2LossTest_testId_fkey";
ALTER TABLE IF EXISTS ONLY public."ActivityLog" DROP CONSTRAINT IF EXISTS "ActivityLog_shelfLifeTestId_fkey";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."TestResult_samplingEventId_key";
DROP INDEX IF EXISTS public."ShelfLifeTest_testNumber_key";
DROP INDEX IF EXISTS public."ShelfLifeTest_status_idx";
DROP INDEX IF EXISTS public."ShelfLifeTest_startDate_idx";
DROP INDEX IF EXISTS public."ShelfLifeCondition_testId_idx";
DROP INDEX IF EXISTS public."SavedCaloriesCalculation_userId_idx";
DROP INDEX IF EXISTS public."SavedCaloriesCalculation_formulationId_idx";
DROP INDEX IF EXISTS public."SavedCaloriesCalculation_createdAt_idx";
DROP INDEX IF EXISTS public."SamplingEvent_testId_plannedDate_idx";
DROP INDEX IF EXISTS public."SamplingEvent_conditionId_idx";
DROP INDEX IF EXISTS public."ParameterResult_testResultId_group_idx";
DROP INDEX IF EXISTS public."OrganolepticPanelistResult_testResultId_idx";
DROP INDEX IF EXISTS public."MaterialsRequest_testId_idx";
DROP INDEX IF EXISTS public."MaterialsRequestItem_materialsRequestId_idx";
DROP INDEX IF EXISTS public."Ingredient_updatedAt_idx";
DROP INDEX IF EXISTS public."Ingredient_ingredientName_key";
DROP INDEX IF EXISTS public."Ingredient_ingredientName_idx";
DROP INDEX IF EXISTS public."Ingredient_category_idx";
DROP INDEX IF EXISTS public."IngredientOverride_scopeType_scopeId_idx";
DROP INDEX IF EXISTS public."IngredientOverride_ingredientId_scopeType_scopeId_key";
DROP INDEX IF EXISTS public."IngredientOverride_ingredientId_idx";
DROP INDEX IF EXISTS public."Formulation_userId_idx";
DROP INDEX IF EXISTS public."FormulationIngredient_ingredientId_idx";
DROP INDEX IF EXISTS public."FormulationIngredient_formulationId_ingredientId_key";
DROP INDEX IF EXISTS public."FormulationIngredient_formulationId_idx";
DROP INDEX IF EXISTS public."CO2LossTest_testId_idx";
DROP INDEX IF EXISTS public."ActivityLog_shelfLifeTestId_createdAt_idx";
DROP INDEX IF EXISTS public."ActivityLog_actorId_createdAt_idx";
DROP INDEX IF EXISTS public."ActivityLog_action_createdAt_idx";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."TestResult" DROP CONSTRAINT IF EXISTS "TestResult_pkey";
ALTER TABLE IF EXISTS ONLY public."ShelfLifeTest" DROP CONSTRAINT IF EXISTS "ShelfLifeTest_pkey";
ALTER TABLE IF EXISTS ONLY public."ShelfLifeCondition" DROP CONSTRAINT IF EXISTS "ShelfLifeCondition_pkey";
ALTER TABLE IF EXISTS ONLY public."SavedCaloriesCalculation" DROP CONSTRAINT IF EXISTS "SavedCaloriesCalculation_pkey";
ALTER TABLE IF EXISTS ONLY public."SamplingEvent" DROP CONSTRAINT IF EXISTS "SamplingEvent_pkey";
ALTER TABLE IF EXISTS ONLY public."ParameterResult" DROP CONSTRAINT IF EXISTS "ParameterResult_pkey";
ALTER TABLE IF EXISTS ONLY public."OrganolepticPanelistResult" DROP CONSTRAINT IF EXISTS "OrganolepticPanelistResult_pkey";
ALTER TABLE IF EXISTS ONLY public."MaterialsRequest" DROP CONSTRAINT IF EXISTS "MaterialsRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."MaterialsRequestItem" DROP CONSTRAINT IF EXISTS "MaterialsRequestItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Ingredient" DROP CONSTRAINT IF EXISTS "Ingredient_pkey";
ALTER TABLE IF EXISTS ONLY public."IngredientOverride" DROP CONSTRAINT IF EXISTS "IngredientOverride_pkey";
ALTER TABLE IF EXISTS ONLY public."Formulation" DROP CONSTRAINT IF EXISTS "Formulation_pkey";
ALTER TABLE IF EXISTS ONLY public."FormulationIngredient" DROP CONSTRAINT IF EXISTS "FormulationIngredient_pkey";
ALTER TABLE IF EXISTS ONLY public."CO2LossTest" DROP CONSTRAINT IF EXISTS "CO2LossTest_pkey";
ALTER TABLE IF EXISTS ONLY public."ActivityLog" DROP CONSTRAINT IF EXISTS "ActivityLog_pkey";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."TestResult";
DROP TABLE IF EXISTS public."ShelfLifeTest";
DROP TABLE IF EXISTS public."ShelfLifeCondition";
DROP TABLE IF EXISTS public."SavedCaloriesCalculation";
DROP TABLE IF EXISTS public."SamplingEvent";
DROP TABLE IF EXISTS public."ParameterResult";
DROP TABLE IF EXISTS public."OrganolepticPanelistResult";
DROP TABLE IF EXISTS public."MaterialsRequestItem";
DROP TABLE IF EXISTS public."MaterialsRequest";
DROP TABLE IF EXISTS public."IngredientOverride";
DROP TABLE IF EXISTS public."Ingredient";
DROP TABLE IF EXISTS public."FormulationIngredient";
DROP TABLE IF EXISTS public."Formulation";
DROP TABLE IF EXISTS public."CO2LossTest";
DROP TABLE IF EXISTS public."ActivityLog";
DROP TYPE IF EXISTS public."ShelfLifeStatus";
DROP TYPE IF EXISTS public."ShelfLifePackagingType";
DROP TYPE IF EXISTS public."ShelfLifeConditionType";
DROP TYPE IF EXISTS public."SamplingEventType";
DROP TYPE IF EXISTS public."SamplingEventStatus";
DROP TYPE IF EXISTS public."ParameterPassFail";
DROP TYPE IF EXISTS public."ParameterGroup";
DROP TYPE IF EXISTS public."NutritionBasis";
DROP TYPE IF EXISTS public."IngredientCategory";
DROP TYPE IF EXISTS public."ActivityEntityType";
DROP TYPE IF EXISTS public."ActivityAction";
--
-- Name: ActivityAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'GENERATE',
    'RESULT_UPDATE',
    'DELETE'
);


--
-- Name: ActivityEntityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityEntityType" AS ENUM (
    'SHELF_LIFE_TEST',
    'SAMPLING_EVENT',
    'TEST_RESULT',
    'FORMULATION',
    'FORMULATION_LINE'
);


--
-- Name: IngredientCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IngredientCategory" AS ENUM (
    'Sweetener',
    'Juice',
    'Acid',
    'Flavor',
    'Extract',
    'Other'
);


--
-- Name: NutritionBasis; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NutritionBasis" AS ENUM (
    'PER_100G',
    'PER_100ML'
);


--
-- Name: ParameterGroup; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ParameterGroup" AS ENUM (
    'MICRO',
    'PHYS_CHEM',
    'CO2',
    'MIGRATION',
    'VISUAL',
    'COATING'
);


--
-- Name: ParameterPassFail; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ParameterPassFail" AS ENUM (
    'PASS',
    'FAIL',
    'NOT_SET'
);


--
-- Name: SamplingEventStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SamplingEventStatus" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'DONE',
    'SKIPPED'
);


--
-- Name: SamplingEventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SamplingEventType" AS ENUM (
    'ZERO',
    'MID',
    'FINAL',
    'EXTRA'
);


--
-- Name: ShelfLifeConditionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShelfLifeConditionType" AS ENUM (
    'REAL_TIME',
    'ACCELERATED',
    'LIGHT_CABINET',
    'REFERENCE_2_5C',
    'AGING_30C'
);


--
-- Name: ShelfLifePackagingType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShelfLifePackagingType" AS ENUM (
    'PET',
    'GLASS',
    'ALUMINUM_CAN',
    'TETRA_PAK'
);


--
-- Name: ShelfLifeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShelfLifeStatus" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActivityLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ActivityLog" (
    id text NOT NULL,
    "shelfLifeTestId" text,
    "entityType" public."ActivityEntityType" NOT NULL,
    "entityId" text NOT NULL,
    action public."ActivityAction" NOT NULL,
    "actorId" text,
    "actorName" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CO2LossTest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CO2LossTest" (
    id text NOT NULL,
    "testId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "productionLine" text,
    "cappingQuality" text,
    "openingTorque" double precision,
    "waterTempInPack" double precision,
    "co2DuringProduction" double precision,
    "co2After24h40C" double precision,
    "co2After48h40C" double precision,
    "co2After24h25C" double precision,
    "co2After48h25C" double precision,
    "generalComment" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Formulation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Formulation" (
    id text NOT NULL,
    "userId" text,
    name text NOT NULL,
    category text NOT NULL,
    "targetBrix" double precision,
    "targetPH" double precision,
    "co2GPerL" double precision,
    "desiredBrix" double precision,
    "temperatureC" double precision,
    "correctedBrix" double precision,
    "densityGPerML" double precision,
    "targetMassPerLiterG" double precision,
    "waterGramsPerLiter" double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FormulationIngredient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FormulationIngredient" (
    id text NOT NULL,
    "formulationId" text NOT NULL,
    "ingredientId" text NOT NULL,
    amount double precision,
    unit text,
    "dosageGrams" double precision NOT NULL,
    "priceOverridePerKg" double precision
);


--
-- Name: Ingredient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ingredient" (
    id text NOT NULL,
    "ingredientName" text NOT NULL,
    category public."IngredientCategory" NOT NULL,
    supplier text NOT NULL,
    "countryOfOrigin" text NOT NULL,
    "pricePerKgEur" double precision NOT NULL,
    "densityKgPerL" double precision,
    "brixPercent" double precision,
    "singleStrengthBrix" double precision,
    "brixDensityTempC" double precision DEFAULT 20 NOT NULL,
    "titratableAcidityPercent" double precision,
    "pH" double precision,
    "co2SolubilityRelevant" boolean DEFAULT false NOT NULL,
    "waterContentPercent" double precision,
    "energyKcal" double precision,
    "energyKj" double precision,
    fat double precision,
    saturates double precision,
    carbohydrates double precision,
    sugars double precision,
    protein double precision,
    salt double precision,
    "nutritionBasis" public."NutritionBasis" DEFAULT 'PER_100G'::public."NutritionBasis" NOT NULL,
    "shelfLifeMonths" integer,
    "storageConditions" text,
    "allergenInfo" text,
    vegan boolean DEFAULT false NOT NULL,
    "natural" boolean DEFAULT false NOT NULL,
    notes text,
    "coaFileUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: IngredientOverride; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IngredientOverride" (
    id text NOT NULL,
    "ingredientId" text NOT NULL,
    "scopeType" text NOT NULL,
    "scopeId" text,
    "overridePricePerKgEur" double precision,
    "overrideDensityKgPerL" double precision,
    "overrideBrixPercent" double precision,
    "overrideTitratableAcidityPercent" double precision,
    "overridePH" double precision,
    "overrideWaterContentPercent" double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MaterialsRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MaterialsRequest" (
    id text NOT NULL,
    "testId" text NOT NULL,
    supplier text,
    terms text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MaterialsRequestItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MaterialsRequestItem" (
    id text NOT NULL,
    "materialsRequestId" text NOT NULL,
    "ingredientName" text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OrganolepticPanelistResult; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrganolepticPanelistResult" (
    id text NOT NULL,
    "testResultId" text NOT NULL,
    "panelistCode" text NOT NULL,
    "tasteScore" double precision,
    "smellScore" double precision,
    "colorScore" double precision,
    "homogeneityScore" double precision,
    "appearanceScore" double precision,
    "overallScore" double precision,
    comments text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ParameterResult; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ParameterResult" (
    id text NOT NULL,
    "testResultId" text NOT NULL,
    "group" public."ParameterGroup" NOT NULL,
    "parameterKey" text NOT NULL,
    unit text,
    "normativeText" text,
    "valueText" text,
    "valueNumber" double precision,
    "passFail" public."ParameterPassFail" DEFAULT 'NOT_SET'::public."ParameterPassFail" NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SamplingEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SamplingEvent" (
    id text NOT NULL,
    "testId" text NOT NULL,
    "conditionId" text,
    "dayOffset" integer NOT NULL,
    "plannedDate" timestamp(3) without time zone NOT NULL,
    type public."SamplingEventType" NOT NULL,
    "requiredLiters" double precision NOT NULL,
    "requiredPacks" integer NOT NULL,
    status public."SamplingEventStatus" DEFAULT 'PLANNED'::public."SamplingEventStatus" NOT NULL,
    "sampleCode" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SavedCaloriesCalculation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedCaloriesCalculation" (
    id text NOT NULL,
    "userId" text,
    "formulationId" text NOT NULL,
    "formulationName" text NOT NULL,
    result jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ShelfLifeCondition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShelfLifeCondition" (
    id text NOT NULL,
    "testId" text NOT NULL,
    type public."ShelfLifeConditionType" NOT NULL,
    "temperatureC" double precision,
    "humidityPct" double precision,
    "lightLux" double precision,
    "wavelengthNmFrom" integer,
    "wavelengthNmTo" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ShelfLifeTest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShelfLifeTest" (
    id text NOT NULL,
    "testNumber" text NOT NULL,
    "productName" text NOT NULL,
    "formulationId" text,
    "packagingType" public."ShelfLifePackagingType" NOT NULL,
    "packVolumeL" double precision NOT NULL,
    carbonated boolean DEFAULT false NOT NULL,
    "co2AtFilling" double precision,
    "plannedShelfLifeDays" integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDatePlanned" timestamp(3) without time zone,
    status public."ShelfLifeStatus" DEFAULT 'PLANNED'::public."ShelfLifeStatus" NOT NULL,
    "createdBy" text,
    "responsiblePerson" text,
    "approvedByNpd" text,
    "approvedByNpdDate" timestamp(3) without time zone,
    "approvedByQuality" text,
    "approvedByQualityDate" timestamp(3) without time zone,
    "reserveCoefficientEnabled" boolean DEFAULT false NOT NULL,
    "finalRecommendation" text,
    "marketRequirements" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TestResult; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TestResult" (
    id text NOT NULL,
    "samplingEventId" text NOT NULL,
    "summaryStatus" text,
    "deviationNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: ActivityLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ActivityLog" (id, "shelfLifeTestId", "entityType", "entityId", action, "actorId", "actorName", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: CO2LossTest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CO2LossTest" (id, "testId", date, "productionLine", "cappingQuality", "openingTorque", "waterTempInPack", "co2DuringProduction", "co2After24h40C", "co2After48h40C", "co2After24h25C", "co2After48h25C", "generalComment", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Formulation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Formulation" (id, "userId", name, category, "targetBrix", "targetPH", "co2GPerL", "desiredBrix", "temperatureC", "correctedBrix", "densityGPerML", "targetMassPerLiterG", "waterGramsPerLiter", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: FormulationIngredient; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FormulationIngredient" (id, "formulationId", "ingredientId", amount, unit, "dosageGrams", "priceOverridePerKg") FROM stdin;
\.


--
-- Data for Name: Ingredient; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ingredient" (id, "ingredientName", category, supplier, "countryOfOrigin", "pricePerKgEur", "densityKgPerL", "brixPercent", "singleStrengthBrix", "brixDensityTempC", "titratableAcidityPercent", "pH", "co2SolubilityRelevant", "waterContentPercent", "energyKcal", "energyKj", fat, saturates, carbohydrates, sugars, protein, salt, "nutritionBasis", "shelfLifeMonths", "storageConditions", "allergenInfo", vegan, "natural", notes, "coaFileUrl", "createdAt", "updatedAt") FROM stdin;
f0d2ad0b-9e73-4467-bfac-bfa535948097	Apple Juice Concentrate	Juice	Kula	Georgia	2.25	\N	70	11.5	20	2.2	3.4	t	30	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.49	2026-04-06 08:02:33.49
fc0e4aff-1a43-4888-b4f3-687037eba524	Lemon Juice Concentrate	Juice	SuperFood	Spain	2.7	\N	48	8	20	36	\N	t	52	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.499	2026-04-06 08:02:33.499
60d788b7-67ba-4bb2-97a5-9a5c555a3091	Cherry Juice Concentrate	Juice	Goknur	Turkey	15	\N	65	12	20	2.3	\N	t	35	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.506	2026-04-06 08:02:33.506
df053bb1-628c-45c0-83fd-31f0f7e62eda	Orange Juice Concentrate	Juice	GatFood	Israel	3.91	\N	50	11.2	20	3.8	\N	t	50	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.511	2026-04-06 08:02:33.511
8ff7e976-7540-40c1-b89c-2779f9a6fd02	Mandarin Juice Concentrate	Juice	Goknur	Turkey	3.75	\N	60	11.2	20	7	3.1	t	40	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.517	2026-04-06 08:02:33.517
0cc7e858-f536-449d-9673-741be40118f2	Pear Juice Concentrate	Juice	GatFood	Israel	2.6	\N	70	12	20	1.05	3.8	t	30	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.523	2026-04-06 08:02:33.523
94f77e4f-2009-4279-b804-600eeaac8a29	Appel Juice Concentrate Cloudy	Juice	Erkon	Turkey	1.5	\N	70	11.5	20	1.8	3.5	t	30	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.526	2026-04-06 08:02:33.526
81da96ee-a031-4f6d-934f-036d133df1ec	White Grape Juice Concentrate	Juice	Georgia	Georgia	1.2	\N	70	16	20	1.8	3.4	t	30	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.531	2026-04-06 08:02:33.531
f1787276-f288-481f-8e18-4246f5ba4989	Red Grape Juice Concentrate	Juice	Georgia	Georgia	3.2	\N	70	16	20	2.5	3.5	t	30	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.536	2026-04-06 08:02:33.536
8f0f2afd-622b-405e-8100-5e2b00555639	Pomegranate Juice Concentrate	Juice	Aznar	Azerbaijan	3	\N	65	16	20	7.2	3.02	t	35	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.54	2026-04-06 08:02:33.54
a99e39f2-5c31-418b-a364-08267df35a06	Quince Juice Concenrrate	Juice	Dohler	Turkey	2.5	\N	65	13	20	3.1	3.47	t	35	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.544	2026-04-06 08:02:33.544
69ae2bac-90a2-4856-8e44-a15ce896f3b8	Red Grapefruit Concenrtrate	Juice	Brazil	Braazil	2.9	\N	65	10.5	20	5.4	3.27	t	35	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.547	2026-04-06 08:02:33.547
457b800d-da62-40b0-ba7a-5e37e5178c23	Passion Fruit Concentrate	Juice	Sunimpex	Vietnam	4.5	\N	50	13.5	20	10.7	3.03	t	50	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.551	2026-04-06 08:02:33.551
1d50e4d6-4973-4c81-9dfd-9d7609339eb8	Agave Syrup	Juice	Mexico	Mexico	3.85	\N	75	\N	20	\N	\N	t	25	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.558	2026-04-06 08:02:33.558
a95cca07-dc8c-4242-bb38-f29545ad402a	Peach Puree	Other	Anadolu	Turkey	1.2	\N	30.3	10.5	20	1.2	3.6	t	69.7	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.564	2026-04-06 08:02:33.564
328b623c-d9b4-41a5-9114-8d0d8cdb0990	Plum Puree	Other	Dohler	Turkey	1.3	\N	30.3	14	20	1.19	3.9	t	69.7	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.573	2026-04-06 08:02:33.573
9e00570e-0ec3-40d1-b2d4-a666e52c4342	Quince Puree	Other	Dohler	Turkey	1.25	\N	21	13	20	1	3.78	t	79	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.58	2026-04-06 08:02:33.58
250c56de-8550-43ef-b686-05d87fa24dea	Apple Puree	Other	Anadolu	Turkey	1.5	\N	30.3	11.5	20	0.61	3.8	t	69.7	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	24	Freezed (-18)	No	t	t	\N	\N	2026-04-06 08:02:33.586	2026-04-06 08:02:33.586
34a85a5d-0658-4621-aefd-174842216f89	Apple Flavor	Flavor	Givaudan	Germany	57	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.592	2026-04-06 08:02:33.592
5ecaa7fb-f7fc-46c7-8455-817df5cd6929	Feijoa Flavor	Flavor	Givaudan	Germany	125	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.597	2026-04-06 08:02:33.597
8704a571-56ec-4991-afec-9ff48c31290b	Mandarin Flavor	Flavor	Givaudan	Germany	27.75	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.604	2026-04-06 08:02:33.604
33a17216-27c1-42a4-bc02-25a9a3782e5b	Kumquat Meiwa Flavor	Flavor	Givaudan	Germany	32.25	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.622	2026-04-06 08:02:33.622
be617182-51fa-4870-b848-78a941ad58ab	Cherry Flavor	Flavor	Givaudan	Germany	49.5	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.625	2026-04-06 08:02:33.625
34154b55-e071-4c4b-ab26-60c6ff95e4a8	Tutti Frutti ( Red Bull Flavor)	Flavor	Dohler	Germany	54.2	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.627	2026-04-06 08:02:33.627
aee309ac-9dbe-412c-81a6-b9a65c032f9f	Mandrona  Flavor	Flavor	Bell	Germany	17.25	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.629	2026-04-06 08:02:33.629
8ef503a3-4511-4c01-84ae-919beebf01f4	Lemon Flavor	Flavor	Bell	Germany	17.2	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.631	2026-04-06 08:02:33.631
6b9e3cb8-852f-4d07-8c64-0f752bb15d0e	Tarragon Flavor	Flavor	Firmenich	Germany	39.05	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.634	2026-04-06 08:02:33.634
b87ab047-03f4-4a50-904b-338549589ba5	Orange Flavor	Flavor	Givaudan	Germany	25	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.638	2026-04-06 08:02:33.638
efcfaf00-7178-4777-b8fc-d4fc5e6f371a	Lemon-Lime Flavor	Flavor	Givaudan	Germany	45.4	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.642	2026-04-06 08:02:33.642
40717371-2745-4b6a-9651-a77f835c57bf	Pear Flavor	Flavor	Dohler	Germany	14.85	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.645	2026-04-06 08:02:33.645
fe008273-3af8-486b-bb83-b8f273f28910	Blood Orange	Flavor	Givaudan	Germany	47	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.648	2026-04-06 08:02:33.648
91a94c65-4c6f-49be-9844-21468530a010	Pomegranate Flavor	Flavor	Givaudan	Germany	45	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.652	2026-04-06 08:02:33.652
74f8d54b-a332-4788-aa81-a83630692917	Peach Flavor	Flavor	Dohler	Germany	20	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.656	2026-04-06 08:02:33.656
1b698358-cbd5-46fe-85e2-597f0167ee05	Pinneaple Flavor	Flavor	Dohler	Germany	35	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.659	2026-04-06 08:02:33.659
b669f3d1-4dd4-4c4c-8bc8-96242aaba032	Plum Flavor	Flavor	Givaudan	Germany	60	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.663	2026-04-06 08:02:33.663
bc4116a3-1aec-4b72-915d-a174b142f43d	Red Grapefruit	Flavor	Givaudan	Germany	102	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.666	2026-04-06 08:02:33.666
5a8eb5b6-c0be-4663-9910-3bbfd10653e6	Tropical Fruit Mix	Flavor	Givaudan	Germany	55	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.671	2026-04-06 08:02:33.671
2294022f-7619-41d1-a52c-da0fbb2bfb21	Watermelone	Flavor	Manne	Germany	35	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.674	2026-04-06 08:02:33.674
22b39c0a-ad6b-4dca-9f7b-4ef45c9615a8	Fruit forrest	Flavor	Manne	Germany	25	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.678	2026-04-06 08:02:33.678
b942f6a1-2b12-4dd5-9d3d-30e993435f6c	Rooibos extract	Extract	ADM	Germany	55	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.682	2026-04-06 08:02:33.682
e20710c3-45e7-4517-8575-e48b3cf45bf7	Cream extract	Extract	ADM	Germany	40	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.686	2026-04-06 08:02:33.686
c4c00792-c2a6-44e8-a916-28d3ca8c08a8	Vanilla extract	Extract	ADM	Germany	45.3	1	0	\N	20	0	\N	t	98	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.689	2026-04-06 08:02:33.689
80dd0d49-0316-4785-a462-98bb958f5112	Beta Carrotine	Other	Givaudan	Germany	29.05	1.06	0	\N	20	0	0	t	99	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.692	2026-04-06 08:02:33.692
f4538633-c23c-4793-b656-0066ddc94a55	Black Carrot	Other	Givaudan	Germany	16.1	\N	62.8	\N	20	6.88	3.3	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.695	2026-04-06 08:02:33.695
cdef28ea-31d7-4474-9589-b5eb8060f29c	Clorophil	Other	Dohler	Germany	105	1	0	\N	20	0	\N	t	99	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.698	2026-04-06 08:02:33.698
aa2d371f-389f-4089-aaa3-cfed77dbf52e	Caramel Color	Other	Dohler	Germany	2.3	1	0	\N	20	0	\N	t	99	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Cold Storage	No	t	t	\N	\N	2026-04-06 08:02:33.702	2026-04-06 08:02:33.702
4c7cef1b-6185-4c13-82e8-8103944b2d90	Sugar	Other	Netherlands	Netherlands	1	\N	99.99	\N	20	0	\N	t	0.01	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Dry Storage	No	t	t	\N	\N	2026-04-06 08:02:33.705	2026-04-06 08:02:33.705
d69e8cb0-bd6c-490d-8197-ec38ef7e1295	Citric Acid	Other	Dohler	China	2.5	\N	99.99	\N	20	100	\N	t	0.01	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Dry Storage	No	t	t	\N	\N	2026-04-06 08:02:33.708	2026-04-06 08:02:33.708
328a2f2b-dcc9-453c-8ee4-dabe14a171f2	Stevia Natural	Other	Essenhub	Italy	214	\N	99.99	\N	20	0	\N	f	0.01	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Dry Storage	No	t	t	\N	\N	2026-04-06 08:02:33.713	2026-04-06 08:02:33.713
e50b6265-dfeb-44df-83fc-38569054030f	Ascorbic Acid	Other	Dohler	China	8.2	\N	99.99	\N	20	0	\N	t	0.01	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Dry Storage	No	t	t	\N	\N	2026-04-06 08:02:33.716	2026-04-06 08:02:33.716
89906c16-a997-43e1-8a04-5b9142cbe647	Taste Gem	Other	Firmenich	Germany	101	\N	99.99	\N	20	0	\N	t	0.01	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Dry Storage	No	t	t	\N	\N	2026-04-06 08:02:33.719	2026-04-06 08:02:33.719
32fb3f1f-0401-4818-b1fc-c24471222eeb	Caffeine	Other	Essenhub	Italy	114	\N	99.99	\N	20	0	\N	t	0.01	\N	\N	\N	\N	\N	\N	\N	\N	PER_100G	12	Dry Storage	No	t	t	\N	\N	2026-04-06 08:02:33.721	2026-04-06 08:02:33.721
\.


--
-- Data for Name: IngredientOverride; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."IngredientOverride" (id, "ingredientId", "scopeType", "scopeId", "overridePricePerKgEur", "overrideDensityKgPerL", "overrideBrixPercent", "overrideTitratableAcidityPercent", "overridePH", "overrideWaterContentPercent", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaterialsRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialsRequest" (id, "testId", supplier, terms, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaterialsRequestItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialsRequestItem" (id, "materialsRequestId", "ingredientName", quantity, unit, "createdAt") FROM stdin;
\.


--
-- Data for Name: OrganolepticPanelistResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrganolepticPanelistResult" (id, "testResultId", "panelistCode", "tasteScore", "smellScore", "colorScore", "homogeneityScore", "appearanceScore", "overallScore", comments, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ParameterResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ParameterResult" (id, "testResultId", "group", "parameterKey", unit, "normativeText", "valueText", "valueNumber", "passFail", comment, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SamplingEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SamplingEvent" (id, "testId", "conditionId", "dayOffset", "plannedDate", type, "requiredLiters", "requiredPacks", status, "sampleCode", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SavedCaloriesCalculation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SavedCaloriesCalculation" (id, "userId", "formulationId", "formulationName", result, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ShelfLifeCondition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShelfLifeCondition" (id, "testId", type, "temperatureC", "humidityPct", "lightLux", "wavelengthNmFrom", "wavelengthNmTo", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: ShelfLifeTest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShelfLifeTest" (id, "testNumber", "productName", "formulationId", "packagingType", "packVolumeL", carbonated, "co2AtFilling", "plannedShelfLifeDays", "startDate", "endDatePlanned", status, "createdBy", "responsiblePerson", "approvedByNpd", "approvedByNpdDate", "approvedByQuality", "approvedByQualityDate", "reserveCoefficientEnabled", "finalRecommendation", "marketRequirements", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TestResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TestResult" (id, "samplingEventId", "summaryStatus", "deviationNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: ActivityLog ActivityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_pkey" PRIMARY KEY (id);


--
-- Name: CO2LossTest CO2LossTest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CO2LossTest"
    ADD CONSTRAINT "CO2LossTest_pkey" PRIMARY KEY (id);


--
-- Name: FormulationIngredient FormulationIngredient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormulationIngredient"
    ADD CONSTRAINT "FormulationIngredient_pkey" PRIMARY KEY (id);


--
-- Name: Formulation Formulation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Formulation"
    ADD CONSTRAINT "Formulation_pkey" PRIMARY KEY (id);


--
-- Name: IngredientOverride IngredientOverride_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IngredientOverride"
    ADD CONSTRAINT "IngredientOverride_pkey" PRIMARY KEY (id);


--
-- Name: Ingredient Ingredient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ingredient"
    ADD CONSTRAINT "Ingredient_pkey" PRIMARY KEY (id);


--
-- Name: MaterialsRequestItem MaterialsRequestItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialsRequestItem"
    ADD CONSTRAINT "MaterialsRequestItem_pkey" PRIMARY KEY (id);


--
-- Name: MaterialsRequest MaterialsRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialsRequest"
    ADD CONSTRAINT "MaterialsRequest_pkey" PRIMARY KEY (id);


--
-- Name: OrganolepticPanelistResult OrganolepticPanelistResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrganolepticPanelistResult"
    ADD CONSTRAINT "OrganolepticPanelistResult_pkey" PRIMARY KEY (id);


--
-- Name: ParameterResult ParameterResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParameterResult"
    ADD CONSTRAINT "ParameterResult_pkey" PRIMARY KEY (id);


--
-- Name: SamplingEvent SamplingEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SamplingEvent"
    ADD CONSTRAINT "SamplingEvent_pkey" PRIMARY KEY (id);


--
-- Name: SavedCaloriesCalculation SavedCaloriesCalculation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedCaloriesCalculation"
    ADD CONSTRAINT "SavedCaloriesCalculation_pkey" PRIMARY KEY (id);


--
-- Name: ShelfLifeCondition ShelfLifeCondition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShelfLifeCondition"
    ADD CONSTRAINT "ShelfLifeCondition_pkey" PRIMARY KEY (id);


--
-- Name: ShelfLifeTest ShelfLifeTest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShelfLifeTest"
    ADD CONSTRAINT "ShelfLifeTest_pkey" PRIMARY KEY (id);


--
-- Name: TestResult TestResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TestResult"
    ADD CONSTRAINT "TestResult_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: ActivityLog_action_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityLog_action_createdAt_idx" ON public."ActivityLog" USING btree (action, "createdAt");


--
-- Name: ActivityLog_actorId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON public."ActivityLog" USING btree ("actorId", "createdAt");


--
-- Name: ActivityLog_shelfLifeTestId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityLog_shelfLifeTestId_createdAt_idx" ON public."ActivityLog" USING btree ("shelfLifeTestId", "createdAt");


--
-- Name: CO2LossTest_testId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CO2LossTest_testId_idx" ON public."CO2LossTest" USING btree ("testId");


--
-- Name: FormulationIngredient_formulationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FormulationIngredient_formulationId_idx" ON public."FormulationIngredient" USING btree ("formulationId");


--
-- Name: FormulationIngredient_formulationId_ingredientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FormulationIngredient_formulationId_ingredientId_key" ON public."FormulationIngredient" USING btree ("formulationId", "ingredientId");


--
-- Name: FormulationIngredient_ingredientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FormulationIngredient_ingredientId_idx" ON public."FormulationIngredient" USING btree ("ingredientId");


--
-- Name: Formulation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Formulation_userId_idx" ON public."Formulation" USING btree ("userId");


--
-- Name: IngredientOverride_ingredientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IngredientOverride_ingredientId_idx" ON public."IngredientOverride" USING btree ("ingredientId");


--
-- Name: IngredientOverride_ingredientId_scopeType_scopeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IngredientOverride_ingredientId_scopeType_scopeId_key" ON public."IngredientOverride" USING btree ("ingredientId", "scopeType", "scopeId");


--
-- Name: IngredientOverride_scopeType_scopeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IngredientOverride_scopeType_scopeId_idx" ON public."IngredientOverride" USING btree ("scopeType", "scopeId");


--
-- Name: Ingredient_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ingredient_category_idx" ON public."Ingredient" USING btree (category);


--
-- Name: Ingredient_ingredientName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ingredient_ingredientName_idx" ON public."Ingredient" USING btree ("ingredientName");


--
-- Name: Ingredient_ingredientName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Ingredient_ingredientName_key" ON public."Ingredient" USING btree ("ingredientName");


--
-- Name: Ingredient_updatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Ingredient_updatedAt_idx" ON public."Ingredient" USING btree ("updatedAt");


--
-- Name: MaterialsRequestItem_materialsRequestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaterialsRequestItem_materialsRequestId_idx" ON public."MaterialsRequestItem" USING btree ("materialsRequestId");


--
-- Name: MaterialsRequest_testId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaterialsRequest_testId_idx" ON public."MaterialsRequest" USING btree ("testId");


--
-- Name: OrganolepticPanelistResult_testResultId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrganolepticPanelistResult_testResultId_idx" ON public."OrganolepticPanelistResult" USING btree ("testResultId");


--
-- Name: ParameterResult_testResultId_group_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ParameterResult_testResultId_group_idx" ON public."ParameterResult" USING btree ("testResultId", "group");


--
-- Name: SamplingEvent_conditionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SamplingEvent_conditionId_idx" ON public."SamplingEvent" USING btree ("conditionId");


--
-- Name: SamplingEvent_testId_plannedDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SamplingEvent_testId_plannedDate_idx" ON public."SamplingEvent" USING btree ("testId", "plannedDate");


--
-- Name: SavedCaloriesCalculation_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedCaloriesCalculation_createdAt_idx" ON public."SavedCaloriesCalculation" USING btree ("createdAt");


--
-- Name: SavedCaloriesCalculation_formulationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedCaloriesCalculation_formulationId_idx" ON public."SavedCaloriesCalculation" USING btree ("formulationId");


--
-- Name: SavedCaloriesCalculation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedCaloriesCalculation_userId_idx" ON public."SavedCaloriesCalculation" USING btree ("userId");


--
-- Name: ShelfLifeCondition_testId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ShelfLifeCondition_testId_idx" ON public."ShelfLifeCondition" USING btree ("testId");


--
-- Name: ShelfLifeTest_startDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ShelfLifeTest_startDate_idx" ON public."ShelfLifeTest" USING btree ("startDate");


--
-- Name: ShelfLifeTest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ShelfLifeTest_status_idx" ON public."ShelfLifeTest" USING btree (status);


--
-- Name: ShelfLifeTest_testNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShelfLifeTest_testNumber_key" ON public."ShelfLifeTest" USING btree ("testNumber");


--
-- Name: TestResult_samplingEventId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TestResult_samplingEventId_key" ON public."TestResult" USING btree ("samplingEventId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ActivityLog ActivityLog_shelfLifeTestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityLog"
    ADD CONSTRAINT "ActivityLog_shelfLifeTestId_fkey" FOREIGN KEY ("shelfLifeTestId") REFERENCES public."ShelfLifeTest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CO2LossTest CO2LossTest_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CO2LossTest"
    ADD CONSTRAINT "CO2LossTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES public."ShelfLifeTest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormulationIngredient FormulationIngredient_formulationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormulationIngredient"
    ADD CONSTRAINT "FormulationIngredient_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES public."Formulation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FormulationIngredient FormulationIngredient_ingredientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FormulationIngredient"
    ADD CONSTRAINT "FormulationIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES public."Ingredient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Formulation Formulation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Formulation"
    ADD CONSTRAINT "Formulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: IngredientOverride IngredientOverride_ingredientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IngredientOverride"
    ADD CONSTRAINT "IngredientOverride_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES public."Ingredient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MaterialsRequestItem MaterialsRequestItem_materialsRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialsRequestItem"
    ADD CONSTRAINT "MaterialsRequestItem_materialsRequestId_fkey" FOREIGN KEY ("materialsRequestId") REFERENCES public."MaterialsRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MaterialsRequest MaterialsRequest_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialsRequest"
    ADD CONSTRAINT "MaterialsRequest_testId_fkey" FOREIGN KEY ("testId") REFERENCES public."ShelfLifeTest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganolepticPanelistResult OrganolepticPanelistResult_testResultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrganolepticPanelistResult"
    ADD CONSTRAINT "OrganolepticPanelistResult_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES public."TestResult"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ParameterResult ParameterResult_testResultId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ParameterResult"
    ADD CONSTRAINT "ParameterResult_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES public."TestResult"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SamplingEvent SamplingEvent_conditionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SamplingEvent"
    ADD CONSTRAINT "SamplingEvent_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES public."ShelfLifeCondition"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SamplingEvent SamplingEvent_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SamplingEvent"
    ADD CONSTRAINT "SamplingEvent_testId_fkey" FOREIGN KEY ("testId") REFERENCES public."ShelfLifeTest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedCaloriesCalculation SavedCaloriesCalculation_formulationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedCaloriesCalculation"
    ADD CONSTRAINT "SavedCaloriesCalculation_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES public."Formulation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedCaloriesCalculation SavedCaloriesCalculation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedCaloriesCalculation"
    ADD CONSTRAINT "SavedCaloriesCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ShelfLifeCondition ShelfLifeCondition_testId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShelfLifeCondition"
    ADD CONSTRAINT "ShelfLifeCondition_testId_fkey" FOREIGN KEY ("testId") REFERENCES public."ShelfLifeTest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShelfLifeTest ShelfLifeTest_formulationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShelfLifeTest"
    ADD CONSTRAINT "ShelfLifeTest_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES public."Formulation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TestResult TestResult_samplingEventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TestResult"
    ADD CONSTRAINT "TestResult_samplingEventId_fkey" FOREIGN KEY ("samplingEventId") REFERENCES public."SamplingEvent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ra4WXENduyUwgrAMMbaEIaLKIlcOZrjndcU6xyu66IfAxljtWkcve16MayoBimo

