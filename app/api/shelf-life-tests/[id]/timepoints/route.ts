import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, generateSamplingPlan } from "@/lib/shelf-life";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import {
  getDevShelfLifeTest,
  regenerateDevSamplingEvents,
} from "@/lib/dev-shelf-life-store";
import { env } from "@/lib/env";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await req.json().catch(() => null);
  const { id } = await params;
  const actor = getActivityActorFromRequest(req);
  const includePetPackagingChangeCase =
    Boolean(
      payload &&
      typeof payload === "object" &&
      "includePetPackagingChangeCase" in payload &&
      (payload as { includePetPackagingChangeCase?: unknown })
        .includePetPackagingChangeCase,
    ) || false;

  try {
    const test = await prisma.shelfLifeTest.findUnique({
      where: { id },
      include: {
        conditions: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: { message: "Shelf-life test not found." } },
        { status: 404 },
      );
    }

    const selectedConditions = [
      ...new Set(
        test.conditions
          .map((condition) => condition.type)
          .filter(
            (type): type is "REAL_TIME" | "ACCELERATED" =>
              type === "REAL_TIME" || type === "ACCELERATED",
          ),
      ),
    ];

    const reserveCoefficient = test.reserveCoefficientEnabled ? 1.15 : 1;

    const events = generateSamplingPlan({
      plannedShelfLifeDays: test.plannedShelfLifeDays,
      packagingType: test.packagingType,
      packVolumeL: test.packVolumeL,
      selectedConditions,
      includePetPackagingChangeCase,
      reserveCoefficient,
    });

    const conditionByType = new Map(
      test.conditions.map((condition) => [condition.type, condition.id]),
    );

    await prisma.$transaction(async (tx) => {
      await tx.organolepticPanelistResult.deleteMany({
        where: {
          testResult: {
            samplingEvent: { testId: id },
          },
        },
      });
      await tx.parameterResult.deleteMany({
        where: {
          testResult: {
            samplingEvent: { testId: id },
          },
        },
      });
      await tx.testResult.deleteMany({
        where: {
          samplingEvent: { testId: id },
        },
      });
      await tx.samplingEvent.deleteMany({
        where: { testId: id },
      });

      for (const event of events) {
        await tx.samplingEvent.create({
          data: {
            testId: id,
            conditionId: conditionByType.get(event.conditionType) ?? null,
            dayOffset: event.dayOffset,
            plannedDate: addDays(test.startDate, event.dayOffset),
            type: event.type,
            requiredLiters: event.requiredLiters,
            requiredPacks: event.requiredPacks,
            status: "PLANNED",
            notes: event.notes ?? null,
          },
        });
      }
    });

    await logActivity({
      shelfLifeTestId: id,
      entityType: "SAMPLING_EVENT",
      entityId: id,
      action: "GENERATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        generatedCount: events.length,
        includePetPackagingChangeCase,
      },
    });

    return NextResponse.json({
      success: true,
      generatedCount: events.length,
    });
  } catch (error) {
    if (isDatabaseUnavailable(error) || process.env.NODE_ENV !== "production") {
      const existing = getDevShelfLifeTest(id);
      if (!existing) {
        return NextResponse.json(
          { error: { message: "Shelf-life test not found." } },
          { status: 404 },
        );
      }

      const updated = regenerateDevSamplingEvents(
        id,
        includePetPackagingChangeCase,
      );
      if (!updated) {
        return NextResponse.json(
          { error: { message: "Shelf-life test not found." } },
          { status: 404 },
        );
      }

      await logActivity({
        shelfLifeTestId: id,
        entityType: "SAMPLING_EVENT",
        entityId: id,
        action: "GENERATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          generatedCount: updated.samplingEvents.length,
          includePetPackagingChangeCase,
          source: "dev-fallback",
        },
      });

      return NextResponse.json({
        success: true,
        generatedCount: updated.samplingEvents.length,
      });
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to regenerate timepoints.",
        },
      },
      { status: 500 },
    );
  }
}
