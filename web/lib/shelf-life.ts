import { z } from "zod";

export const PLANNED_SHELF_LIFE_OPTIONS = [
  180, 270, 365, 455, 545, 730,
] as const;

export const PACKAGING_TYPES = [
  "PET",
  "GLASS",
  "ALUMINUM_CAN",
  "TETRA_PAK",
] as const;

export const CONDITION_TYPES = ["REAL_TIME", "ACCELERATED"] as const;

export const EVENT_TYPES = ["ZERO", "MID", "FINAL", "EXTRA"] as const;

export const PARAMETER_GROUPS = [
  "MICRO",
  "PHYS_CHEM",
  "CO2",
  "MIGRATION",
  "VISUAL",
  "COATING",
] as const;

export type PackagingType = (typeof PACKAGING_TYPES)[number];
export type ConditionType = (typeof CONDITION_TYPES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type ParameterGroup = (typeof PARAMETER_GROUPS)[number];

export type ConditionDefaults = {
  temperatureC: number | null;
  humidityPct: number | null;
  lightLux: number | null;
  wavelengthNmFrom: number | null;
  wavelengthNmTo: number | null;
  notes: string;
};

const CONDITION_DEFAULTS: Record<ConditionType, ConditionDefaults> = {
  REAL_TIME: {
    temperatureC: 22,
    humidityPct: 60,
    lightLux: 200,
    wavelengthNmFrom: 580,
    wavelengthNmTo: 750,
    notes: "Typical real-time storage condition.",
  },
  ACCELERATED: {
    temperatureC: 41,
    humidityPct: 75,
    lightLux: null,
    wavelengthNmFrom: null,
    wavelengthNmTo: null,
    notes: "40–42°C accelerated condition; for aluminum/tetra use RH ~75%.",
  },
};

const REAL_TIME_OFFSETS: Record<number, number[]> = {
  180: [0, 60, 150, 180, 207],
  270: [0, 91, 225, 270, 311],
  365: [0, 122, 315, 365, 420],
  455: [0, 152, 390, 455, 523],
  545: [0, 183, 455, 545, 627],
  730: [0, 243, 610, 730, 840],
};

const ACCELERATED_OFFSETS: Record<number, number[]> = {
  180: [0, 29, 42, 58, 73],
  270: [0, 29, 42, 58, 73, 87],
  365: [0, 29, 42, 58, 73, 87, 117],
  455: [0, 29, 42, 58, 73, 87, 117],
  545: [0, 29, 42, 58, 73, 87, 117],
  730: [0, 29, 42, 58, 73, 87, 117],
};

export type EventVolumeRequirement = {
  liters: number;
  minPacks: number;
  breakdown: string;
};

export const EVENT_REQUIREMENTS: Record<EventType, EventVolumeRequirement> = {
  ZERO: {
    liters: 6.5,
    minPacks: 8,
    breakdown:
      "Organoleptic ≥1.5L/2; Phys-chem ≥1.5L/2; Microbiology ≥7L/8 (as in procedure).",
  },
  MID: {
    liters: 3.5,
    minPacks: 6,
    breakdown: "Organoleptic ≥1.5L/2; Phys-chem ≥1.5L/2; Microbiology ≥0.5L/2.",
  },
  FINAL: {
    liters: 10.5,
    minPacks: 12,
    breakdown:
      "Organoleptic ≥1.5L/2; Phys-chem ≥4.5L/4; Microbiology ≥3.5L/4; Reference ≥1.0L/4.",
  },
  EXTRA: {
    liters: 3.5,
    minPacks: 6,
    breakdown: "Extra checkpoint default requirement.",
  },
};

export type SamplingPlanEvent = {
  dayOffset: number;
  type: EventType;
  requiredLiters: number;
  requiredPacks: number;
  requiredAnalyses: string[];
  notes?: string;
  conditionType: ConditionType;
};

function resolveEventType(index: number, total: number): EventType {
  if (index === 0) {
    return "ZERO";
  }
  if (index === total - 1) {
    return "FINAL";
  }
  return "MID";
}

export function getConditionDefaults(type: ConditionType): ConditionDefaults {
  return CONDITION_DEFAULTS[type];
}

export function calculateRequiredPacks(
  eventType: EventType,
  packVolumeL: number,
): { liters: number; packs: number; minPacks: number } {
  const req = EVENT_REQUIREMENTS[eventType];
  const byVolume = Math.ceil(req.liters / Math.max(packVolumeL, 0.001));
  const packs = Math.max(req.minPacks, byVolume);

  return {
    liters: req.liters,
    packs,
    minPacks: req.minPacks,
  };
}

export function generateSamplingPlan(options: {
  plannedShelfLifeDays: number;
  packagingType: PackagingType;
  packVolumeL: number;
  selectedConditions: ConditionType[];
  includePetPackagingChangeCase?: boolean;
  reserveCoefficient?: number;
}): SamplingPlanEvent[] {
  const {
    plannedShelfLifeDays,
    packagingType,
    packVolumeL,
    selectedConditions,
    includePetPackagingChangeCase = false,
    reserveCoefficient = 1.15,
  } = options;

  const events: SamplingPlanEvent[] = [];

  for (const condition of selectedConditions) {
    let offsets: number[] = [];

    if (condition === "REAL_TIME") {
      offsets = REAL_TIME_OFFSETS[plannedShelfLifeDays] ?? [
        0,
        plannedShelfLifeDays,
      ];
    } else if (condition === "ACCELERATED") {
      offsets = ACCELERATED_OFFSETS[plannedShelfLifeDays] ?? [
        0, 29, 58, 87, 117,
      ];
    }

    const uniqueOffsets = [...new Set(offsets)].sort((a, b) => a - b);

    uniqueOffsets.forEach((offset, index) => {
      const eventType = resolveEventType(index, uniqueOffsets.length);

      const required = calculateRequiredPacks(eventType, packVolumeL);

      events.push({
        dayOffset: offset,
        type: eventType,
        requiredLiters: required.liters,
        requiredPacks: required.packs,
        conditionType: condition,
        requiredAnalyses: [
          "ORGANOLEPTIC",
          "PHYS_CHEM",
          "MICRO",
          "CO2",
          "MIGRATION",
        ],
      });
    });
  }

  if (packagingType === "PET" && includePetPackagingChangeCase) {
    const days = Math.ceil((plannedShelfLifeDays * reserveCoefficient) / 30);
    for (let month = 1; month <= days; month += 1) {
      const offset = month * 30;
      const required = calculateRequiredPacks("MID", packVolumeL);
      events.push({
        dayOffset: offset,
        type: "EXTRA",
        requiredLiters: required.liters,
        requiredPacks: required.packs,
        conditionType: "REAL_TIME",
        requiredAnalyses: ["VISUAL", "CO2"],
        notes: "PET packaging-change monthly checkpoint.",
      });
    }
  }

  return events.sort((a, b) => a.dayOffset - b.dayOffset);
}

export function addDays(date: Date, dayOffset: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + dayOffset);
  return next;
}

export function computeQ10Rate(options: {
  r1: number;
  t1: number;
  t2: number;
  q10: number;
}): number {
  const { r1, t1, t2, q10 } = options;
  return r1 / q10 ** ((t2 - t1) / 10);
}

export function computeSpecificDecarbTime(options: {
  tDays: number;
  c0: number;
  c: number;
}): number {
  const { tDays, c0, c } = options;
  if (c <= 0 || c0 <= 0 || c0 <= c) {
    return Number.NaN;
  }
  return tDays / (c0 / c - 1);
}

export function computeRequiredDecarbDuration(options: {
  c0: number;
  ct: number;
  targetSpecificTime: number;
}): number {
  const { c0, ct, targetSpecificTime } = options;
  if (ct <= 0 || c0 <= 0 || targetSpecificTime <= 0) {
    return Number.NaN;
  }
  return ((c0 - ct) * targetSpecificTime) / ct;
}

export function co2EndOfLifePass(c0: number, cEnd: number): boolean {
  if (!Number.isFinite(c0) || !Number.isFinite(cEnd) || c0 <= 0) {
    return false;
  }
  return cEnd >= c0 * 0.9;
}

export const shelfLifeCreateSchema = z.object({
  productName: z.string().trim().min(2),
  formulationId: z.string().trim().optional().nullable(),
  packagingType: z.enum(PACKAGING_TYPES),
  packVolumeL: z.number().positive(),
  carbonated: z.boolean(),
  co2AtFilling: z.number().positive().optional().nullable(),
  plannedShelfLifeDays: z
    .number()
    .refine(
      (value) =>
        PLANNED_SHELF_LIFE_OPTIONS.includes(
          value as 180 | 270 | 365 | 455 | 545 | 730,
        ),
      {
        message: "Unsupported planned shelf-life value.",
      },
    ),
  startDate: z.string().datetime(),
  selectedConditions: z.array(z.enum(CONDITION_TYPES)).min(1),
  includePetPackagingChangeCase: z.boolean().optional(),
  reserveCoefficientEnabled: z.boolean().optional(),
  marketRequirements: z.string().optional().nullable(),
  responsiblePerson: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  materialsRequest: z
    .object({
      supplier: z.string().optional().nullable(),
      terms: z.string().optional().nullable(),
      items: z
        .array(
          z.object({
            ingredientName: z.string().trim().min(1),
            quantity: z.number().positive(),
            unit: z.string().trim().min(1),
          }),
        )
        .default([]),
    })
    .optional(),
});

export const updateEventStatusSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE", "SKIPPED"]),
  sampleCode: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const upsertResultSchema = z.object({
  summaryStatus: z.string().trim().optional().nullable(),
  deviationNotes: z.string().trim().optional().nullable(),
  parameters: z
    .array(
      z.object({
        group: z.enum(PARAMETER_GROUPS),
        parameterKey: z.string().trim().min(1),
        unit: z.string().trim().optional().nullable(),
        normativeText: z.string().trim().optional().nullable(),
        valueText: z.string().trim().optional().nullable(),
        valueNumber: z.number().optional().nullable(),
        passFail: z.enum(["PASS", "FAIL", "NOT_SET"]).default("NOT_SET"),
        comment: z.string().trim().optional().nullable(),
      }),
    )
    .default([]),
  panelists: z
    .array(
      z.object({
        panelistCode: z.string().trim().min(1),
        tasteScore: z.number().min(0).max(5).optional().nullable(),
        smellScore: z.number().min(0).max(5).optional().nullable(),
        colorScore: z.number().min(0).max(5).optional().nullable(),
        homogeneityScore: z.number().min(0).max(5).optional().nullable(),
        appearanceScore: z.number().min(0).max(5).optional().nullable(),
        overallScore: z.number().min(0).max(5).optional().nullable(),
        comments: z.string().trim().optional().nullable(),
      }),
    )
    .default([]),
});

export const updateConclusionSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
  finalRecommendation: z.string().trim().optional().nullable(),
  reserveCoefficientEnabled: z.boolean().optional(),
  approvedByNpd: z.string().trim().optional().nullable(),
  approvedByNpdDate: z.string().datetime().optional().nullable(),
  approvedByQuality: z.string().trim().optional().nullable(),
  approvedByQualityDate: z.string().datetime().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const MICRO_TEMPLATE = [
  { key: "yeast_mold", label: "Yeast/Mold", norm: "<10 CFU/100 ml" },
  {
    key: "acetic_bacteria",
    label: "Acetic acid bacteria",
    norm: "<10 CFU/100 ml",
  },
  {
    key: "lactic_bacteria",
    label: "Lactic acid bacteria",
    norm: "<10 CFU/100 ml",
  },
  { key: "tpc", label: "Total plate count", norm: "<10 CFU/100 ml" },
  { key: "coliforms", label: "Coliforms", norm: "Not allowed in 100 ml" },
  {
    key: "pathogens",
    label: "Pathogens incl. Salmonella",
    norm: "Not allowed in 25 ml",
  },
] as const;

export const PHYS_CHEM_TEMPLATE = [
  { key: "ph", label: "pH", norm: "Per product spec" },
  {
    key: "titratable_acidity",
    label: "Titratable acidity",
    norm: "Per product spec",
  },
  {
    key: "dry_solids",
    label: "Dry solids",
    norm: "Required for carbohydrate-added beverages",
  },
  { key: "ionization", label: "Ionization level", norm: "Water products only" },
  {
    key: "permanganate_oxidation",
    label: "Permanganate oxidation",
    norm: "Water products only",
  },
] as const;

export function migrationTemplateByPackaging(packagingType: PackagingType) {
  if (packagingType === "PET") {
    return ["formaldehyde", "alcohol_butyl_isobutyl", "acetaldehyde"];
  }

  if (packagingType === "GLASS") {
    return ["aluminum", "boron", "arsenic", "lead"];
  }

  if (packagingType === "ALUMINUM_CAN") {
    return ["aluminum", "iron", "copper", "zinc", "bisphenol_a"];
  }

  return [
    "formaldehyde",
    "ethyl_acetate",
    "acetone",
    "alcohol_methyl_propyl_isopropyl_butyl_isobutyl",
  ];
}

export function generateSampleLabel(
  testNumber: string,
  dayOffset: number,
  index: number,
): string {
  return `${testNumber}-D${String(dayOffset).padStart(3, "0")}-S${String(index + 1).padStart(2, "0")}`;
}
