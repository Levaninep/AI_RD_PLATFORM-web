export type ShelfLifeStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";
export type SamplingEventStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "DONE"
  | "SKIPPED";
export type PackagingType = "PET" | "GLASS" | "ALUMINUM_CAN" | "TETRA_PAK";
export type ConditionType = "REAL_TIME" | "ACCELERATED";

export type ShelfLifeCondition = {
  id: string;
  type: ConditionType;
  temperatureC: number | null;
  humidityPct: number | null;
  lightLux: number | null;
  wavelengthNmFrom: number | null;
  wavelengthNmTo: number | null;
  notes: string | null;
};

export type ParameterResult = {
  id: string;
  group: "MICRO" | "PHYS_CHEM" | "CO2" | "MIGRATION" | "VISUAL" | "COATING";
  parameterKey: string;
  unit: string | null;
  normativeText: string | null;
  valueText: string | null;
  valueNumber: number | null;
  passFail: "PASS" | "FAIL" | "NOT_SET";
  comment: string | null;
};

export type OrganolepticPanelistResult = {
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

export type TestResult = {
  id: string;
  summaryStatus: string | null;
  deviationNotes: string | null;
  parameterResults: ParameterResult[];
  organolepticPanelists: OrganolepticPanelistResult[];
};

export type SamplingEvent = {
  id: string;
  conditionId: string | null;
  dayOffset: number;
  plannedDate: string;
  type: "ZERO" | "MID" | "FINAL" | "EXTRA";
  requiredLiters: number;
  requiredPacks: number;
  status: SamplingEventStatus;
  sampleCode: string | null;
  notes: string | null;
  condition?: ShelfLifeCondition | null;
  testResult?: TestResult | null;
};

export type MaterialsRequestItem = {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
};

export type MaterialsRequest = {
  id: string;
  supplier: string | null;
  terms: string | null;
  items: MaterialsRequestItem[];
};

export type ShelfLifeTest = {
  id: string;
  testNumber: string;
  productName: string;
  packagingType: PackagingType;
  packVolumeL: number;
  carbonated: boolean;
  co2AtFilling: number | null;
  plannedShelfLifeDays: number;
  startDate: string;
  endDatePlanned: string | null;
  status: ShelfLifeStatus;
  responsiblePerson: string | null;
  approvedByNpd: string | null;
  approvedByNpdDate: string | null;
  approvedByQuality: string | null;
  approvedByQualityDate: string | null;
  reserveCoefficientEnabled: boolean;
  finalRecommendation: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  conditions: ShelfLifeCondition[];
  samplingEvents: SamplingEvent[];
  materialsRequests: MaterialsRequest[];
  nextSamplingEvent?: {
    id: string;
    plannedDate: string;
    status: SamplingEventStatus;
    dayOffset: number;
  } | null;
};

export type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "GENERATE"
  | "RESULT_UPDATE"
  | "DELETE";

export type ActivityEntityType =
  | "SHELF_LIFE_TEST"
  | "SAMPLING_EVENT"
  | "TEST_RESULT";

export type ShelfLifeActivityLog = {
  id: string;
  shelfLifeTestId: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};
