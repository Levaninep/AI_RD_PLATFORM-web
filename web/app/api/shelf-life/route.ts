import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import {
  createDevShelfLifeTest,
  listDevShelfLifeTests,
} from "@/lib/dev-shelf-life-store";
import {
  addDays,
  generateSamplingPlan,
  getConditionDefaults,
  shelfLifeCreateSchema,
} from "@/lib/shelf-life";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import { env } from "@/lib/env";

function createTestNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SLT-${yyyy}${mm}${dd}-${hh}${mi}-${suffix}`;
}

const includeFull = {
  conditions: true,
  samplingEvents: {
    orderBy: { plannedDate: "asc" as const },
    include: {
      condition: true,
      testResult: {
        include: {
          parameterResults: true,
          organolepticPanelists: true,
        },
      },
    },
  },
  materialsRequests: {
    include: {
      items: true,
    },
  },
  co2LossTests: true,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const tests = await prisma.shelfLifeTest.findMany({
      where: status
        ? {
            status:
              status === "PLANNED" ||
              status === "IN_PROGRESS" ||
              status === "COMPLETED"
                ? status
                : undefined,
          }
        : undefined,
      include: {
        conditions: {
          select: {
            id: true,
            type: true,
          },
        },
        samplingEvents: {
          orderBy: { plannedDate: "asc" },
          select: {
            id: true,
            plannedDate: true,
            status: true,
            dayOffset: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const enriched = tests.map((test) => {
      const next = test.samplingEvents.find(
        (event) =>
          event.status !== "DONE" &&
          event.status !== "SKIPPED" &&
          event.plannedDate >= now,
      );

      return {
        ...test,
        nextSamplingEvent: next ?? null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        listDevShelfLifeTests(
          status === "PLANNED" ||
            status === "IN_PROGRESS" ||
            status === "COMPLETED"
            ? status
            : undefined,
        ),
      );
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load shelf-life tests.",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const actor = getActivityActorFromRequest(req);

  try {
    const parsed = shelfLifeCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            message: parsed.error.issues[0]?.message ?? "Invalid input.",
          },
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    if (data.carbonated && !data.co2AtFilling) {
      return NextResponse.json(
        {
          error: {
            message: "CO2 at filling is required for carbonated tests.",
          },
        },
        { status: 400 },
      );
    }

    const startDate = new Date(data.startDate);
    const reserveCoefficient = data.reserveCoefficientEnabled ? 1.15 : 1;
    const selectedConditions = [...new Set(data.selectedConditions)];

    const events = generateSamplingPlan({
      plannedShelfLifeDays: data.plannedShelfLifeDays,
      packagingType: data.packagingType,
      packVolumeL: data.packVolumeL,
      selectedConditions,
      includePetPackagingChangeCase: data.includePetPackagingChangeCase,
      reserveCoefficient,
    });

    const created = await prisma.$transaction(async (tx) => {
      const test = await tx.shelfLifeTest.create({
        data: {
          testNumber: createTestNumber(),
          productName: data.productName,
          formulationId: data.formulationId ?? null,
          packagingType: data.packagingType,
          packVolumeL: data.packVolumeL,
          carbonated: data.carbonated,
          co2AtFilling: data.carbonated ? (data.co2AtFilling ?? null) : null,
          plannedShelfLifeDays: data.plannedShelfLifeDays,
          startDate,
          endDatePlanned: addDays(
            startDate,
            Math.round(data.plannedShelfLifeDays * reserveCoefficient),
          ),
          status: "PLANNED",
          createdBy: data.createdBy ?? null,
          responsiblePerson: data.responsiblePerson ?? null,
          reserveCoefficientEnabled: Boolean(data.reserveCoefficientEnabled),
          marketRequirements: data.marketRequirements ?? null,
          notes: data.notes ?? null,
        },
      });

      const conditionByType = new Map<string, string>();
      for (const conditionType of selectedConditions) {
        const defaults = getConditionDefaults(conditionType);
        const condition = await tx.shelfLifeCondition.create({
          data: {
            testId: test.id,
            type: conditionType,
            temperatureC: defaults.temperatureC,
            humidityPct: defaults.humidityPct,
            lightLux: defaults.lightLux,
            wavelengthNmFrom: defaults.wavelengthNmFrom,
            wavelengthNmTo: defaults.wavelengthNmTo,
            notes: defaults.notes,
          },
        });

        conditionByType.set(conditionType, condition.id);
      }

      for (const event of events) {
        await tx.samplingEvent.create({
          data: {
            testId: test.id,
            conditionId: conditionByType.get(event.conditionType) ?? null,
            dayOffset: event.dayOffset,
            plannedDate: addDays(startDate, event.dayOffset),
            type: event.type,
            requiredLiters: event.requiredLiters,
            requiredPacks: event.requiredPacks,
            status: "PLANNED",
            notes: event.notes ?? null,
          },
        });
      }

      if (data.materialsRequest && data.materialsRequest.items.length > 0) {
        await tx.materialsRequest.create({
          data: {
            testId: test.id,
            supplier: data.materialsRequest.supplier ?? null,
            terms: data.materialsRequest.terms ?? null,
            items: {
              create: data.materialsRequest.items.map((item) => ({
                ingredientName: item.ingredientName,
                quantity: item.quantity,
                unit: item.unit,
              })),
            },
          },
        });
      }

      return tx.shelfLifeTest.findUniqueOrThrow({
        where: { id: test.id },
        include: includeFull,
      });
    });

    await logActivity({
      shelfLifeTestId: created.id,
      entityType: "SHELF_LIFE_TEST",
      entityId: created.id,
      action: "CREATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        testNumber: created.testNumber,
        productName: created.productName,
        conditionsCount: created.conditions.length,
        samplingEventsCount: created.samplingEvents.length,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailable(error) || !env.isProduction) {
      const parsed = shelfLifeCreateSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: {
              message: parsed.error.issues[0]?.message ?? "Invalid input.",
            },
          },
          { status: 400 },
        );
      }

      const data = parsed.data;
      const created = createDevShelfLifeTest({
        productName: data.productName,
        formulationId: data.formulationId ?? null,
        packagingType: data.packagingType,
        packVolumeL: data.packVolumeL,
        carbonated: data.carbonated,
        co2AtFilling: data.carbonated ? (data.co2AtFilling ?? null) : null,
        plannedShelfLifeDays: data.plannedShelfLifeDays,
        startDate: new Date(data.startDate),
        selectedConditions: data.selectedConditions,
        includePetPackagingChangeCase: data.includePetPackagingChangeCase,
        reserveCoefficientEnabled: data.reserveCoefficientEnabled,
        marketRequirements: data.marketRequirements ?? null,
        responsiblePerson: data.responsiblePerson ?? null,
        createdBy: data.createdBy ?? null,
        notes: data.notes ?? null,
        materialsRequest: data.materialsRequest,
      });

      await logActivity({
        shelfLifeTestId: created.id,
        entityType: "SHELF_LIFE_TEST",
        entityId: created.id,
        action: "CREATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          testNumber: created.testNumber,
          productName: created.productName,
          conditionsCount: created.conditions.length,
          samplingEventsCount: created.samplingEvents.length,
          source: "dev-fallback",
        },
      });

      return NextResponse.json(created, { status: 201 });
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to create shelf-life test.",
        },
      },
      { status: 500 },
    );
  }
}
