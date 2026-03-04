import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateConclusionSchema } from "@/lib/shelf-life";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import {
  deleteDevShelfLifeTest,
  getDevShelfLifeTest,
  updateDevShelfLifeTest,
} from "@/lib/dev-shelf-life-store";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const test = await prisma.shelfLifeTest.findUnique({
      where: { id },
      include: includeFull,
    });

    if (!test) {
      return NextResponse.json(
        { error: { message: "Shelf-life test not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json(test);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const test = getDevShelfLifeTest(id);
      if (!test) {
        return NextResponse.json(
          { error: { message: "Shelf-life test not found." } },
          { status: 404 },
        );
      }

      return NextResponse.json(test);
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load shelf-life test.",
        },
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await req.json().catch(() => null);
  const { id } = await params;
  const actor = getActivityActorFromRequest(req);

  try {
    const parsed = updateConclusionSchema.safeParse(payload);
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

    const before = await prisma.shelfLifeTest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        finalRecommendation: true,
        reserveCoefficientEnabled: true,
        approvedByNpd: true,
        approvedByNpdDate: true,
        approvedByQuality: true,
        approvedByQualityDate: true,
        notes: true,
      },
    });

    if (!before) {
      return NextResponse.json(
        { error: { message: "Shelf-life test not found." } },
        { status: 404 },
      );
    }

    const updated = await prisma.shelfLifeTest.update({
      where: { id },
      data: {
        status: data.status,
        finalRecommendation: data.finalRecommendation ?? undefined,
        reserveCoefficientEnabled: data.reserveCoefficientEnabled,
        approvedByNpd: data.approvedByNpd ?? undefined,
        approvedByNpdDate: data.approvedByNpdDate
          ? new Date(data.approvedByNpdDate)
          : data.approvedByNpdDate === null
            ? null
            : undefined,
        approvedByQuality: data.approvedByQuality ?? undefined,
        approvedByQualityDate: data.approvedByQualityDate
          ? new Date(data.approvedByQualityDate)
          : data.approvedByQualityDate === null
            ? null
            : undefined,
        notes: data.notes ?? undefined,
      },
      include: includeFull,
    });

    const changedFields: string[] = [];
    if (before.status !== updated.status) changedFields.push("status");
    if (before.finalRecommendation !== updated.finalRecommendation) {
      changedFields.push("finalRecommendation");
    }
    if (
      before.reserveCoefficientEnabled !== updated.reserveCoefficientEnabled
    ) {
      changedFields.push("reserveCoefficientEnabled");
    }
    if (before.approvedByNpd !== updated.approvedByNpd) {
      changedFields.push("approvedByNpd");
    }
    if (
      (before.approvedByNpdDate?.toISOString() ?? null) !==
      (updated.approvedByNpdDate?.toISOString() ?? null)
    ) {
      changedFields.push("approvedByNpdDate");
    }
    if (before.approvedByQuality !== updated.approvedByQuality) {
      changedFields.push("approvedByQuality");
    }
    if (
      (before.approvedByQualityDate?.toISOString() ?? null) !==
      (updated.approvedByQualityDate?.toISOString() ?? null)
    ) {
      changedFields.push("approvedByQualityDate");
    }
    if (before.notes !== updated.notes) changedFields.push("notes");

    await logActivity({
      shelfLifeTestId: updated.id,
      entityType: "SHELF_LIFE_TEST",
      entityId: updated.id,
      action: "UPDATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        changedFields,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const parsed = updateConclusionSchema.safeParse(payload);
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

      const updated = updateDevShelfLifeTest(id, {
        status: parsed.data.status,
        finalRecommendation: parsed.data.finalRecommendation,
        reserveCoefficientEnabled: parsed.data.reserveCoefficientEnabled,
        approvedByNpd: parsed.data.approvedByNpd,
        approvedByNpdDate: parsed.data.approvedByNpdDate
          ? new Date(parsed.data.approvedByNpdDate)
          : parsed.data.approvedByNpdDate === null
            ? null
            : undefined,
        approvedByQuality: parsed.data.approvedByQuality,
        approvedByQualityDate: parsed.data.approvedByQualityDate
          ? new Date(parsed.data.approvedByQualityDate)
          : parsed.data.approvedByQualityDate === null
            ? null
            : undefined,
        notes: parsed.data.notes,
      });

      if (!updated) {
        return NextResponse.json(
          { error: { message: "Shelf-life test not found." } },
          { status: 404 },
        );
      }

      await logActivity({
        shelfLifeTestId: updated.id,
        entityType: "SHELF_LIFE_TEST",
        entityId: updated.id,
        action: "UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          changedFields: [
            "status",
            "finalRecommendation",
            "reserveCoefficientEnabled",
            "approvedByNpd",
            "approvedByNpdDate",
            "approvedByQuality",
            "approvedByQualityDate",
            "notes",
          ],
          source: "dev-fallback",
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to update shelf-life test.",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const actor = getActivityActorFromRequest(req);

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: { message: "Invalid shelf-life test ID." } },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.shelfLifeTest.findUnique({
      where: { id },
      select: { id: true, testNumber: true, productName: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { message: "Shelf-life test not found." } },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.organolepticPanelistResult.deleteMany({
        where: {
          testResult: {
            samplingEvent: {
              testId: id,
            },
          },
        },
      }),
      prisma.parameterResult.deleteMany({
        where: {
          testResult: {
            samplingEvent: {
              testId: id,
            },
          },
        },
      }),
      prisma.testResult.deleteMany({
        where: {
          samplingEvent: {
            testId: id,
          },
        },
      }),
      prisma.samplingEvent.deleteMany({ where: { testId: id } }),
      prisma.shelfLifeCondition.deleteMany({ where: { testId: id } }),
      prisma.shelfLifeTest.delete({ where: { id } }),
    ]);

    await logActivity({
      shelfLifeTestId: null,
      entityType: "SHELF_LIFE_TEST",
      entityId: id,
      action: "DELETE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        testNumber: existing.testNumber,
        productName: existing.productName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const existing = getDevShelfLifeTest(id);
      const deleted = deleteDevShelfLifeTest(id);
      if (!deleted) {
        return NextResponse.json(
          { error: { message: "Shelf-life test not found." } },
          { status: 404 },
        );
      }

      await logActivity({
        shelfLifeTestId: null,
        entityType: "SHELF_LIFE_TEST",
        entityId: id,
        action: "DELETE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          testNumber: existing?.testNumber,
          productName: existing?.productName,
          source: "dev-fallback",
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete shelf-life test.",
        },
      },
      { status: 500 },
    );
  }
}
