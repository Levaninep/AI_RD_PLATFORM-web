import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/ai_rd_platform";

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

type DemoTestSeed = {
  testNumber: string;
  productName: string;
  packagingType: "PET" | "GLASS";
  packVolumeL: number;
  carbonated: boolean;
  co2AtFilling: number | null;
  plannedShelfLifeDays: number;
  startDate: string;
  status: "PLANNED" | "IN_PROGRESS";
  responsiblePerson: string;
  selectedConditions: Array<"REAL_TIME" | "ACCELERATED">;
};

function toIngredientCategory(
  raw: string,
): "Sweetener" | "Juice" | "Acid" | "Flavor" | "Extract" | "Other" {
  const normalized = raw.trim().toLowerCase();

  if (normalized === "sweetener") {
    return "Sweetener";
  }

  if (normalized.includes("juice")) {
    return "Juice";
  }

  if (normalized === "acid") {
    return "Acid";
  }

  if (normalized === "flavor") {
    return "Flavor";
  }

  if (normalized === "extract") {
    return "Extract";
  }

  return "Other";
}

function inferCo2Relevance(input: { category: string; name: string }): boolean {
  const category = input.category.trim().toLowerCase();
  const name = input.name.trim().toLowerCase();
  return (
    category.includes("juice") ||
    category.includes("acid") ||
    name.includes("syrup")
  );
}

function densityAndBrixForIngredient(name: string): {
  densityKgPerL: number | null;
  brixPercent: number | null;
} {
  const normalized = name.trim().toLowerCase();

  const exact: Record<string, { densityKgPerL: number; brixPercent: number }> =
    {
      "apple juice concentrate": { densityKgPerL: 1.347, brixPercent: 70.0 },
      "lemon juice concentrate": { densityKgPerL: 1.228, brixPercent: 48.0 },
      "cherry juice concentrate": { densityKgPerL: 1.32, brixPercent: 65.0 },
      "orange juice concentrate": { densityKgPerL: 1.233, brixPercent: 50.0 },
      "mandarin juice concentrate": { densityKgPerL: 1.288, brixPercent: 60.0 },
      "pear juice concentrate": { densityKgPerL: 1.347, brixPercent: 70.0 },
      "apple juice concentrate cloudy": {
        densityKgPerL: 1.347,
        brixPercent: 70.0,
      },
      "white grape juice concentrate": {
        densityKgPerL: 1.347,
        brixPercent: 70.0,
      },
      "red grape juice concentrate": {
        densityKgPerL: 1.347,
        brixPercent: 70.0,
      },
      "pomegranate juice concentrate": {
        densityKgPerL: 1.32,
        brixPercent: 65.0,
      },
      "quince juice concentrate": { densityKgPerL: 1.32, brixPercent: 65.0 },
      "red grapefruit concentrate": { densityKgPerL: 1.32, brixPercent: 65.0 },
      "passion fruit concentrate": { densityKgPerL: 1.233, brixPercent: 50.0 },
      "peach puree": { densityKgPerL: 1.122, brixPercent: 30.3 },
      "plum puree": { densityKgPerL: 1.122, brixPercent: 30.3 },
      "quince puree": { densityKgPerL: 1.087, brixPercent: 21.0 },
      "apple puree": { densityKgPerL: 1.122, brixPercent: 30.3 },
      water: { densityKgPerL: 1.0, brixPercent: 0 },
    };

  if (exact[normalized]) {
    return exact[normalized];
  }

  if (
    normalized.includes("apple") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.347, brixPercent: 70.0 };
  }
  if (
    normalized.includes("lemon") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.228, brixPercent: 48.0 };
  }
  if (
    normalized.includes("cherry") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.32, brixPercent: 65.0 };
  }
  if (
    normalized.includes("orange") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.233, brixPercent: 50.0 };
  }
  if (
    normalized.includes("mandarin") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.288, brixPercent: 60.0 };
  }
  if (normalized.includes("pear") && normalized.includes("conc")) {
    return { densityKgPerL: 1.347, brixPercent: 70.0 };
  }
  if (normalized.includes("white grape") && normalized.includes("conc")) {
    return { densityKgPerL: 1.347, brixPercent: 70.0 };
  }
  if (normalized.includes("red grape") && normalized.includes("conc")) {
    return { densityKgPerL: 1.347, brixPercent: 70.0 };
  }
  if (normalized.includes("pomegranate") && normalized.includes("conc")) {
    return { densityKgPerL: 1.32, brixPercent: 65.0 };
  }
  if (
    normalized.includes("quince") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.32, brixPercent: 65.0 };
  }
  if (normalized.includes("grapefruit") && normalized.includes("conc")) {
    return { densityKgPerL: 1.32, brixPercent: 65.0 };
  }
  if (normalized.includes("passion") && normalized.includes("conc")) {
    return { densityKgPerL: 1.233, brixPercent: 50.0 };
  }
  if (normalized.includes("peach") && normalized.includes("puree")) {
    return { densityKgPerL: 1.122, brixPercent: 30.3 };
  }
  if (normalized.includes("plum") && normalized.includes("puree")) {
    return { densityKgPerL: 1.122, brixPercent: 30.3 };
  }
  if (normalized.includes("quince") && normalized.includes("puree")) {
    return { densityKgPerL: 1.087, brixPercent: 21.0 };
  }
  if (normalized === "water") {
    return { densityKgPerL: 1.0, brixPercent: 0 };
  }

  return { densityKgPerL: null, brixPercent: null };
}

function singleStrengthBrixForIngredient(name: string): number | null {
  const normalized = name.trim().toLowerCase();

  const exact: Record<string, number> = {
    "apple juice concentrate": 11.5,
    "lemon juice concentrate": 8.0,
    "cherry juice concentrate": 15.5,
    "orange juice concentrate": 11.8,
    "mandarin juice concentrate": 11.2,
    "pear juice concentrate": 12.0,
    "apple juice concentrate cloudy": 11.5,
    "white grape juice concentrate": 16.0,
    "red grape juice concentrate": 16.0,
    "pomegranate juice concentrate": 16.5,
    "quince juice concentrate": 13.0,
    "red grapefruit concentrate": 10.5,
    "passion fruit concentrate": 13.5,
  };

  return exact[normalized] ?? null;
}

const INGREDIENTS_SEED = [
  {
    name: "Apple Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Lemon Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Cherry Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Orange Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Mandarin Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Pear Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Apple Juice Concentrate Cloudy",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "White Grape Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Red Grape Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Pomegranate Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Quince Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Red Grapefruit Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Passion Fruit Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Peach Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Plum Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Quince Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Apple Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Water",
    category: "Other",
    supplier: "Template Import",
    pricePerKg: 0,
  },
] as const;

const SHELF_LIFE_DEMO_TESTS: DemoTestSeed[] = [
  {
    testNumber: "SLT-DEMO-0001",
    productName: "Tarragon Sparkling PET 0.5L",
    packagingType: "PET",
    packVolumeL: 0.5,
    carbonated: true,
    co2AtFilling: 5.2,
    plannedShelfLifeDays: 365,
    startDate: "2026-03-01T00:00:00.000Z",
    status: "IN_PROGRESS",
    responsiblePerson: "Nino K.",
    selectedConditions: ["REAL_TIME", "ACCELERATED"],
  },
  {
    testNumber: "SLT-DEMO-0002",
    productName: "Ice Tea Lemon Glass 0.33L",
    packagingType: "GLASS",
    packVolumeL: 0.33,
    carbonated: false,
    co2AtFilling: null,
    plannedShelfLifeDays: 270,
    startDate: "2026-03-10T00:00:00.000Z",
    status: "PLANNED",
    responsiblePerson: "Giorgi M.",
    selectedConditions: ["REAL_TIME", "ACCELERATED"],
  },
];

function addDays(baseIsoDate: string, dayOffset: number): Date {
  const date = new Date(baseIsoDate);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

function eventsForDays(
  days: number,
  condition: DemoTestSeed["selectedConditions"][number],
) {
  const realTime: Record<number, number[]> = {
    180: [0, 60, 150, 180, 207],
    270: [0, 91, 225, 270, 311],
    365: [0, 122, 315, 365, 420],
    455: [0, 152, 390, 455, 523],
    545: [0, 183, 455, 545, 627],
    730: [0, 243, 610, 730, 840],
  };
  const accelerated: Record<number, number[]> = {
    180: [0, 29, 42, 58, 73],
    270: [0, 29, 42, 58, 73, 87],
    365: [0, 29, 42, 58, 73, 87, 117],
    455: [0, 29, 42, 58, 73, 87, 117],
    545: [0, 29, 42, 58, 73, 87, 117],
    730: [0, 29, 42, 58, 73, 87, 117],
  };

  if (condition === "REAL_TIME") {
    return realTime[days] ?? [0, days];
  }

  if (condition === "ACCELERATED") {
    return accelerated[days] ?? [0, 29, 58, 87, 117];
  }

  return [0, days];
}

function requirementByEventType(eventType: "ZERO" | "MID" | "FINAL" | "EXTRA") {
  if (eventType === "ZERO") {
    return { liters: 6.5, minPacks: 8 };
  }

  if (eventType === "FINAL") {
    return { liters: 10.5, minPacks: 12 };
  }

  return { liters: 3.5, minPacks: 6 };
}

async function seedShelfLifeTests(): Promise<void> {
  const formulation = await prisma.formulation.findFirst({
    select: { id: true },
  });

  for (const demo of SHELF_LIFE_DEMO_TESTS) {
    const existing = await prisma.shelfLifeTest.findUnique({
      where: { testNumber: demo.testNumber },
      select: { id: true },
    });

    if (existing) {
      await prisma.shelfLifeTest.delete({ where: { id: existing.id } });
    }

    const created = await prisma.shelfLifeTest.create({
      data: {
        testNumber: demo.testNumber,
        productName: demo.productName,
        formulationId: formulation?.id ?? null,
        packagingType: demo.packagingType,
        packVolumeL: demo.packVolumeL,
        carbonated: demo.carbonated,
        co2AtFilling: demo.co2AtFilling,
        plannedShelfLifeDays: demo.plannedShelfLifeDays,
        startDate: new Date(demo.startDate),
        endDatePlanned: addDays(
          demo.startDate,
          Math.round(demo.plannedShelfLifeDays * 1.15),
        ),
        status: demo.status,
        createdBy: "seed-script",
        responsiblePerson: demo.responsiblePerson,
        reserveCoefficientEnabled: true,
        notes: "Demo shelf-life record generated by seed.",
        marketRequirements: "Default local market requirements",
      },
    });

    const conditionIds = new Map<string, string>();

    for (const conditionType of demo.selectedConditions) {
      const condition = await prisma.shelfLifeCondition.create({
        data: {
          testId: created.id,
          type: conditionType,
          temperatureC:
            conditionType === "REAL_TIME"
              ? 22
              : conditionType === "ACCELERATED"
                ? 41
                : 22,
          humidityPct:
            conditionType === "ACCELERATED"
              ? 75
              : conditionType === "REAL_TIME"
                ? 60
                : null,
          lightLux: conditionType === "REAL_TIME" ? 200 : null,
          wavelengthNmFrom: conditionType === "REAL_TIME" ? 580 : null,
          wavelengthNmTo: conditionType === "REAL_TIME" ? 750 : null,
          notes: "Seeded condition",
        },
      });

      conditionIds.set(conditionType, condition.id);
    }

    let zeroEventId: string | null = null;
    let finalEventId: string | null = null;

    for (const conditionType of demo.selectedConditions) {
      const offsets = eventsForDays(demo.plannedShelfLifeDays, conditionType);

      offsets.forEach(async () => {
        // no-op to keep lint quiet for async callbacks; actual creation below uses for..of
      });

      for (let index = 0; index < offsets.length; index += 1) {
        const offset = offsets[index];
        const eventType =
          index === 0 ? "ZERO" : index === offsets.length - 1 ? "FINAL" : "MID";
        const req = requirementByEventType(eventType);
        const packs = Math.max(
          req.minPacks,
          Math.ceil(req.liters / demo.packVolumeL),
        );

        const event = await prisma.samplingEvent.create({
          data: {
            testId: created.id,
            conditionId: conditionIds.get(conditionType) ?? null,
            dayOffset: offset,
            plannedDate: addDays(demo.startDate, offset),
            type: eventType,
            requiredLiters: req.liters,
            requiredPacks: packs,
            status:
              eventType === "ZERO"
                ? "DONE"
                : demo.status === "PLANNED"
                  ? "PLANNED"
                  : "IN_PROGRESS",
            sampleCode: `${demo.testNumber}-D${String(offset).padStart(3, "0")}`,
            notes: "Seeded event",
          },
        });

        if (eventType === "ZERO" && !zeroEventId) {
          zeroEventId = event.id;
        }

        if (eventType === "FINAL" && !finalEventId) {
          finalEventId = event.id;
        }
      }
    }

    if (zeroEventId) {
      await prisma.testResult.create({
        data: {
          samplingEventId: zeroEventId,
          summaryStatus: "Baseline within limits",
          deviationNotes: null,
          parameterResults: {
            create: [
              {
                group: "MICRO",
                parameterKey: "yeast_mold",
                normativeText: "<10 CFU/100 ml",
                valueText: "<10",
                passFail: "PASS",
              },
              {
                group: "PHYS_CHEM",
                parameterKey: "ph",
                normativeText: "Per product spec",
                valueNumber: 3.15,
                passFail: "PASS",
              },
              {
                group: "VISUAL",
                parameterKey: "hermeticity",
                normativeText: "No leakage; geometry and marking intact",
                valueText: "Conforming",
                passFail: "PASS",
              },
            ],
          },
          organolepticPanelists: {
            create: Array.from({ length: 7 }).map((_, idx) => ({
              panelistCode: `P-${idx + 1}`,
              overallScore: 4.6,
            })),
          },
        },
      });
    }

    if (finalEventId) {
      await prisma.testResult.create({
        data: {
          samplingEventId: finalEventId,
          summaryStatus: "Projected pass with reserve coefficient",
          deviationNotes: "Minor color shift within tolerance",
          parameterResults: {
            create: [
              {
                group: "CO2",
                parameterKey: "specific_decarb_time",
                normativeText: "Must be ≤300",
                valueNumber: 248,
                passFail: "PASS",
              },
              {
                group: "CO2",
                parameterKey: "end_of_life_co2_ratio",
                normativeText: "End-of-life CO2 must be ≥90% of initial",
                valueNumber: 93,
                passFail: "PASS",
              },
              {
                group: "COATING",
                parameterKey: "corrosion_oxidation",
                normativeText: "No corrosion/oxidation traces",
                valueText: "No traces",
                passFail: "PASS",
              },
            ],
          },
          organolepticPanelists: {
            create: Array.from({ length: 7 }).map((_, idx) => ({
              panelistCode: `P-${idx + 1}`,
              overallScore: 4.1,
            })),
          },
        },
      });
    }

    await prisma.materialsRequest.create({
      data: {
        testId: created.id,
        supplier: "Demo Supplier",
        terms: "Incoterms EXW",
        items: {
          create: [
            {
              ingredientName: "White refined sugar ICUMSA 45",
              quantity: 120,
              unit: "kg",
            },
            {
              ingredientName: "Citric acid monohydrate",
              quantity: 8,
              unit: "kg",
            },
            { ingredientName: "Tarragon flavor", quantity: 3, unit: "kg" },
          ],
        },
      },
    });
  }
}

async function seed(): Promise<void> {
  let inserted = 0;
  let updated = 0;

  for (const item of INGREDIENTS_SEED) {
    const metrics = densityAndBrixForIngredient(item.name);

    const existing = await prisma.ingredient.findFirst({
      where: { ingredientName: item.name },
      select: { id: true },
    });

    const nextData = {
      ingredientName: item.name,
      category: toIngredientCategory(item.category),
      supplier: item.supplier ?? "Internal",
      countryOfOrigin: "Unknown",
      pricePerKgEur: item.pricePerKg,
      densityKgPerL: metrics.densityKgPerL,
      brixPercent: metrics.brixPercent,
      singleStrengthBrix: singleStrengthBrixForIngredient(item.name),
      titratableAcidityPercent: null,
      pH: null,
      co2SolubilityRelevant: inferCo2Relevance({
        category: item.category,
        name: item.name,
      }),
      waterContentPercent: null,
      shelfLifeMonths: null,
      storageConditions: null,
      allergenInfo: null,
      vegan: false,
      natural: false,
      notes: null,
      coaFileUrl: null,
    };

    if (existing) {
      await prisma.ingredient.update({
        where: { id: existing.id },
        data: nextData,
      });
    } else {
      await prisma.ingredient.create({
        data: nextData,
      });
    }

    if (existing) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  console.log(
    `Seed complete. Inserted: ${inserted}, Updated: ${updated}, Total processed: ${INGREDIENTS_SEED.length}`,
  );

  await seedShelfLifeTests();
  console.log(`Shelf-life demo tests seeded: ${SHELF_LIFE_DEMO_TESTS.length}`);
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
