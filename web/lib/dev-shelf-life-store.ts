import {
  addDays,
  generateSamplingPlan,
  getConditionDefaults,
  type ConditionType,
  type EventType,
  type PackagingType,
} from "@/lib/shelf-life";

type DevPassFail = "PASS" | "FAIL" | "NOT_SET";
type DevEventStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED";
type DevStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

type DevParameter = {
  id: string;
  group: "MICRO" | "PHYS_CHEM" | "CO2" | "MIGRATION" | "VISUAL" | "COATING";
  parameterKey: string;
  unit: string | null;
  normativeText: string | null;
  valueText: string | null;
  valueNumber: number | null;
  passFail: DevPassFail;
  comment: string | null;
};

type DevPanelist = {
  id: string;
  panelistCode: string;
  tasteScore: number | null;
  smellScore: number | null;
  colorScore: number | null;
  homogeneityScore: number | null;
  appearanceScore: number | null;
  overallScore: number | null;
  comments: string | null;
};

type DevTestResult = {
  id: string;
  summaryStatus: string | null;
  deviationNotes: string | null;
  parameterResults: DevParameter[];
  organolepticPanelists: DevPanelist[];
};

type DevCondition = {
  id: string;
  type: ConditionType;
  temperatureC: number | null;
  humidityPct: number | null;
  lightLux: number | null;
  wavelengthNmFrom: number | null;
  wavelengthNmTo: number | null;
  notes: string | null;
};

type DevEvent = {
  id: string;
  conditionId: string | null;
  dayOffset: number;
  plannedDate: Date;
  type: EventType;
  requiredLiters: number;
  requiredPacks: number;
  status: DevEventStatus;
  sampleCode: string | null;
  notes: string | null;
  testResult: DevTestResult | null;
};

type DevMaterialsRequest = {
  id: string;
  supplier: string | null;
  terms: string | null;
  items: Array<{
    id: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }>;
};

type DevShelfLifeTest = {
  id: string;
  testNumber: string;
  productName: string;
  formulationId: string | null;
  packagingType: PackagingType;
  packVolumeL: number;
  carbonated: boolean;
  co2AtFilling: number | null;
  plannedShelfLifeDays: number;
  startDate: Date;
  endDatePlanned: Date | null;
  status: DevStatus;
  createdBy: string | null;
  responsiblePerson: string | null;
  approvedByNpd: string | null;
  approvedByNpdDate: Date | null;
  approvedByQuality: string | null;
  approvedByQualityDate: Date | null;
  reserveCoefficientEnabled: boolean;
  finalRecommendation: string | null;
  marketRequirements: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  conditions: DevCondition[];
  samplingEvents: DevEvent[];
  materialsRequests: DevMaterialsRequest[];
  co2LossTests: unknown[];
};

type DevStore = {
  tests: DevShelfLifeTest[];
};

const globalStore = globalThis as unknown as { __devShelfLifeStore?: DevStore };
const store: DevStore = globalStore.__devShelfLifeStore ?? { tests: [] };
if (!globalStore.__devShelfLifeStore) {
  globalStore.__devShelfLifeStore = store;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createTestNumber(): string {
  return `SLT-DEV-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function enrich(test: DevShelfLifeTest) {
  const now = new Date();
  const nextSamplingEvent = test.samplingEvents
    .slice()
    .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime())
    .find(
      (event) =>
        event.status !== "DONE" &&
        event.status !== "SKIPPED" &&
        event.plannedDate >= now,
    );

  return {
    ...test,
    nextSamplingEvent: nextSamplingEvent
      ? {
          id: nextSamplingEvent.id,
          plannedDate: nextSamplingEvent.plannedDate,
          status: nextSamplingEvent.status,
          dayOffset: nextSamplingEvent.dayOffset,
        }
      : null,
    samplingEvents: test.samplingEvents.map((event) => ({
      ...event,
      condition:
        test.conditions.find(
          (condition) => condition.id === event.conditionId,
        ) ?? null,
    })),
  };
}

function ensureSeeded() {
  if (store.tests.length > 0) {
    return;
  }

  const startDate = new Date("2026-03-01T00:00:00.000Z");
  const conditions: ConditionType[] = ["REAL_TIME", "ACCELERATED"];

  const conditionRows = conditions.map((type) => {
    const defaults = getConditionDefaults(type);
    return {
      id: createId("slc"),
      type,
      temperatureC: defaults.temperatureC,
      humidityPct: defaults.humidityPct,
      lightLux: defaults.lightLux,
      wavelengthNmFrom: defaults.wavelengthNmFrom,
      wavelengthNmTo: defaults.wavelengthNmTo,
      notes: defaults.notes,
    } satisfies DevCondition;
  });

  const conditionByType = new Map(
    conditionRows.map((item) => [item.type, item.id]),
  );

  const events = generateSamplingPlan({
    plannedShelfLifeDays: 365,
    packagingType: "PET",
    packVolumeL: 0.5,
    selectedConditions: conditions,
    reserveCoefficient: 1.15,
  }).map((event) => ({
    id: createId("sle"),
    conditionId: conditionByType.get(event.conditionType) ?? null,
    dayOffset: event.dayOffset,
    plannedDate: addDays(startDate, event.dayOffset),
    type: event.type,
    requiredLiters: event.requiredLiters,
    requiredPacks: event.requiredPacks,
    status: event.type === "ZERO" ? "DONE" : "IN_PROGRESS",
    sampleCode: null,
    notes: event.notes ?? null,
    testResult: null,
  })) satisfies DevEvent[];

  store.tests.push({
    id: createId("slt"),
    testNumber: "SLT-DEV-0001",
    productName: "Demo Tarragon Sparkling",
    formulationId: null,
    packagingType: "PET",
    packVolumeL: 0.5,
    carbonated: true,
    co2AtFilling: 5.0,
    plannedShelfLifeDays: 365,
    startDate,
    endDatePlanned: addDays(startDate, Math.round(365 * 1.15)),
    status: "IN_PROGRESS",
    createdBy: "dev-fallback",
    responsiblePerson: "Demo User",
    approvedByNpd: null,
    approvedByNpdDate: null,
    approvedByQuality: null,
    approvedByQualityDate: null,
    reserveCoefficientEnabled: true,
    finalRecommendation: null,
    marketRequirements: "Demo mode",
    notes: "In-memory fallback data",
    createdAt: new Date(),
    updatedAt: new Date(),
    conditions: conditionRows,
    samplingEvents: events,
    materialsRequests: [],
    co2LossTests: [],
  });
}

export function listDevShelfLifeTests(status?: DevStatus) {
  ensureSeeded();

  const rows = status
    ? store.tests.filter((item) => item.status === status)
    : store.tests;

  return rows
    .map(enrich)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getDevShelfLifeTest(id: string) {
  ensureSeeded();
  const row = store.tests.find((item) => item.id === id);
  return row ? enrich(row) : null;
}

export function createDevShelfLifeTest(input: {
  productName: string;
  formulationId: string | null;
  packagingType: PackagingType;
  packVolumeL: number;
  carbonated: boolean;
  co2AtFilling: number | null;
  plannedShelfLifeDays: number;
  startDate: Date;
  selectedConditions: ConditionType[];
  includePetPackagingChangeCase?: boolean;
  reserveCoefficientEnabled?: boolean;
  marketRequirements?: string | null;
  responsiblePerson?: string | null;
  createdBy?: string | null;
  notes?: string | null;
  materialsRequest?: {
    supplier?: string | null;
    terms?: string | null;
    items: Array<{ ingredientName: string; quantity: number; unit: string }>;
  };
}) {
  ensureSeeded();

  const reserveCoefficient = input.reserveCoefficientEnabled ? 1.15 : 1;
  const selectedConditions = [...new Set(input.selectedConditions)];

  const conditions = selectedConditions.map((type) => {
    const defaults = getConditionDefaults(type);
    return {
      id: createId("slc"),
      type,
      temperatureC: defaults.temperatureC,
      humidityPct: defaults.humidityPct,
      lightLux: defaults.lightLux,
      wavelengthNmFrom: defaults.wavelengthNmFrom,
      wavelengthNmTo: defaults.wavelengthNmTo,
      notes: defaults.notes,
    } satisfies DevCondition;
  });

  const conditionByType = new Map(
    conditions.map((item) => [item.type, item.id]),
  );
  const events = generateSamplingPlan({
    plannedShelfLifeDays: input.plannedShelfLifeDays,
    packagingType: input.packagingType,
    packVolumeL: input.packVolumeL,
    selectedConditions,
    includePetPackagingChangeCase: input.includePetPackagingChangeCase,
    reserveCoefficient,
  }).map((event) => ({
    id: createId("sle"),
    conditionId: conditionByType.get(event.conditionType) ?? null,
    dayOffset: event.dayOffset,
    plannedDate: addDays(input.startDate, event.dayOffset),
    type: event.type,
    requiredLiters: event.requiredLiters,
    requiredPacks: event.requiredPacks,
    status: "PLANNED" as DevEventStatus,
    sampleCode: null,
    notes: event.notes ?? null,
    testResult: null,
  }));

  const now = new Date();
  const created: DevShelfLifeTest = {
    id: createId("slt"),
    testNumber: createTestNumber(),
    productName: input.productName,
    formulationId: input.formulationId,
    packagingType: input.packagingType,
    packVolumeL: input.packVolumeL,
    carbonated: input.carbonated,
    co2AtFilling: input.co2AtFilling,
    plannedShelfLifeDays: input.plannedShelfLifeDays,
    startDate: input.startDate,
    endDatePlanned: addDays(
      input.startDate,
      Math.round(input.plannedShelfLifeDays * reserveCoefficient),
    ),
    status: "PLANNED",
    createdBy: input.createdBy ?? null,
    responsiblePerson: input.responsiblePerson ?? null,
    approvedByNpd: null,
    approvedByNpdDate: null,
    approvedByQuality: null,
    approvedByQualityDate: null,
    reserveCoefficientEnabled: Boolean(input.reserveCoefficientEnabled),
    finalRecommendation: null,
    marketRequirements: input.marketRequirements ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
    conditions,
    samplingEvents: events,
    co2LossTests: [],
    materialsRequests:
      input.materialsRequest && input.materialsRequest.items.length > 0
        ? [
            {
              id: createId("slm"),
              supplier: input.materialsRequest.supplier ?? null,
              terms: input.materialsRequest.terms ?? null,
              items: input.materialsRequest.items.map((item) => ({
                id: createId("slmi"),
                ingredientName: item.ingredientName,
                quantity: item.quantity,
                unit: item.unit,
              })),
            },
          ]
        : [],
  };

  store.tests.unshift(created);
  return enrich(created);
}

export function updateDevShelfLifeTest(
  id: string,
  patch: Partial<DevShelfLifeTest>,
) {
  ensureSeeded();
  const index = store.tests.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }

  store.tests[index] = {
    ...store.tests[index],
    ...patch,
    updatedAt: new Date(),
  };

  return enrich(store.tests[index]);
}

export function deleteDevShelfLifeTest(id: string): boolean {
  ensureSeeded();
  const before = store.tests.length;
  store.tests = store.tests.filter((item) => item.id !== id);
  return store.tests.length !== before;
}

export function updateDevSamplingEvent(
  testId: string,
  eventId: string,
  patch: {
    status: DevEventStatus;
    sampleCode?: string | null;
    notes?: string | null;
  },
) {
  ensureSeeded();
  const test = store.tests.find((item) => item.id === testId);
  if (!test) {
    return null;
  }

  const event = test.samplingEvents.find((item) => item.id === eventId);
  if (!event) {
    return null;
  }

  event.status = patch.status;
  event.sampleCode = patch.sampleCode ?? null;
  event.notes = patch.notes ?? null;
  test.updatedAt = new Date();

  return { ...event };
}

export function upsertDevSamplingResult(
  testId: string,
  eventId: string,
  payload: {
    summaryStatus?: string | null;
    deviationNotes?: string | null;
    parameters: Array<{
      group: DevParameter["group"];
      parameterKey: string;
      unit?: string | null;
      normativeText?: string | null;
      valueText?: string | null;
      valueNumber?: number | null;
      passFail: DevPassFail;
      comment?: string | null;
    }>;
    panelists: Array<{
      panelistCode: string;
      tasteScore?: number | null;
      smellScore?: number | null;
      colorScore?: number | null;
      homogeneityScore?: number | null;
      appearanceScore?: number | null;
      overallScore?: number | null;
      comments?: string | null;
    }>;
  },
) {
  ensureSeeded();
  const test = store.tests.find((item) => item.id === testId);
  if (!test) {
    return null;
  }

  const event = test.samplingEvents.find((item) => item.id === eventId);
  if (!event) {
    return null;
  }

  const result: DevTestResult = {
    id: event.testResult?.id ?? createId("slr"),
    summaryStatus: payload.summaryStatus ?? null,
    deviationNotes: payload.deviationNotes ?? null,
    parameterResults: payload.parameters.map((item) => ({
      id: createId("slp"),
      group: item.group,
      parameterKey: item.parameterKey,
      unit: item.unit ?? null,
      normativeText: item.normativeText ?? null,
      valueText: item.valueText ?? null,
      valueNumber: item.valueNumber ?? null,
      passFail: item.passFail,
      comment: item.comment ?? null,
    })),
    organolepticPanelists: payload.panelists.map((item) => ({
      id: createId("slop"),
      panelistCode: item.panelistCode,
      tasteScore: item.tasteScore ?? null,
      smellScore: item.smellScore ?? null,
      colorScore: item.colorScore ?? null,
      homogeneityScore: item.homogeneityScore ?? null,
      appearanceScore: item.appearanceScore ?? null,
      overallScore: item.overallScore ?? null,
      comments: item.comments ?? null,
    })),
  };

  event.testResult = result;
  test.updatedAt = new Date();

  return result;
}

export function regenerateDevSamplingEvents(
  testId: string,
  includePetPackagingChangeCase?: boolean,
) {
  ensureSeeded();
  const test = store.tests.find((item) => item.id === testId);
  if (!test) {
    return null;
  }

  const selectedConditions = [
    ...new Set(test.conditions.map((condition) => condition.type)),
  ];
  const reserveCoefficient = test.reserveCoefficientEnabled ? 1.15 : 1;

  const conditionByType = new Map(
    test.conditions.map((condition) => [condition.type, condition.id]),
  );

  const events = generateSamplingPlan({
    plannedShelfLifeDays: test.plannedShelfLifeDays,
    packagingType: test.packagingType,
    packVolumeL: test.packVolumeL,
    selectedConditions,
    includePetPackagingChangeCase,
    reserveCoefficient,
  }).map((event) => ({
    id: createId("sle"),
    conditionId: conditionByType.get(event.conditionType) ?? null,
    dayOffset: event.dayOffset,
    plannedDate: addDays(test.startDate, event.dayOffset),
    type: event.type,
    requiredLiters: event.requiredLiters,
    requiredPacks: event.requiredPacks,
    status: "PLANNED" as DevEventStatus,
    sampleCode: null,
    notes: event.notes ?? null,
    testResult: null,
  }));

  test.samplingEvents = events;
  test.updatedAt = new Date();

  return enrich(test);
}

export function patchDevResultById(
  resultId: string,
  patch: {
    summaryStatus?: string | null;
    deviationNotes?: string | null;
  },
) {
  ensureSeeded();

  for (const test of store.tests) {
    for (const event of test.samplingEvents) {
      if (event.testResult?.id !== resultId) {
        continue;
      }

      event.testResult.summaryStatus =
        patch.summaryStatus === undefined
          ? event.testResult.summaryStatus
          : patch.summaryStatus;
      event.testResult.deviationNotes =
        patch.deviationNotes === undefined
          ? event.testResult.deviationNotes
          : patch.deviationNotes;
      test.updatedAt = new Date();

      return {
        testId: test.id,
        eventId: event.id,
        result: event.testResult,
      };
    }
  }

  return null;
}
