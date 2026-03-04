import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { patchDevResultById } from "@/lib/dev-shelf-life-store";
import { env } from "@/lib/env";

const updateResultByIdSchema = z.object({
  summaryStatus: z.string().max(120).nullable().optional(),
  deviationNotes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const payload = await req.json().catch(() => null);
  const { resultId } = await params;
  const actor = getActivityActorFromRequest(req);

  try {
    const parsed = updateResultByIdSchema.safeParse(payload);
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

    const existing = await prisma.testResult.findUnique({
      where: { id: resultId },
      include: {
        samplingEvent: {
          select: {
            id: true,
            testId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { message: "Result not found." } },
        { status: 404 },
      );
    }

    const updated = await prisma.testResult.update({
      where: { id: resultId },
      data: {
        summaryStatus:
          parsed.data.summaryStatus === undefined
            ? undefined
            : parsed.data.summaryStatus,
        deviationNotes:
          parsed.data.deviationNotes === undefined
            ? undefined
            : parsed.data.deviationNotes,
      },
      include: {
        parameterResults: true,
        organolepticPanelists: true,
      },
    });

    const changedFields: string[] = [];
    if ((existing.summaryStatus ?? null) !== (updated.summaryStatus ?? null)) {
      changedFields.push("summaryStatus");
    }
    if (
      (existing.deviationNotes ?? null) !== (updated.deviationNotes ?? null)
    ) {
      changedFields.push("deviationNotes");
    }

    await logActivity({
      shelfLifeTestId: existing.samplingEvent.testId,
      entityType: "TEST_RESULT",
      entityId: resultId,
      action: "RESULT_UPDATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        changedFields,
        samplingEventId: existing.samplingEvent.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (isDatabaseUnavailable(error) || !env.isProduction) {
      const parsed = updateResultByIdSchema.safeParse(payload);
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

      const updated = patchDevResultById(resultId, {
        summaryStatus: parsed.data.summaryStatus,
        deviationNotes: parsed.data.deviationNotes,
      });

      if (!updated) {
        return NextResponse.json(
          { error: { message: "Result not found." } },
          { status: 404 },
        );
      }

      await logActivity({
        shelfLifeTestId: updated.testId,
        entityType: "TEST_RESULT",
        entityId: resultId,
        action: "RESULT_UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          changedFields: ["summaryStatus", "deviationNotes"],
          samplingEventId: updated.eventId,
          source: "dev-fallback",
        },
      });

      return NextResponse.json(updated.result);
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to update result.",
        },
      },
      { status: 500 },
    );
  }
}
