import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import {
  deleteDevShelfLifeTest,
  getDevShelfLifeTest,
} from "@/lib/dev-shelf-life-store";
import { PUT as updateShelfLifeTest } from "@/app/api/shelf-life/[id]/route";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateShelfLifeTest(req, { params });
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
