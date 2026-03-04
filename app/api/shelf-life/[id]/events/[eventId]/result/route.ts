import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { upsertResultSchema } from "@/lib/shelf-life";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { upsertDevSamplingResult } from "@/lib/dev-shelf-life-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const payload = await req.json().catch(() => null);
  const { id, eventId } = await params;
  const actor = getActivityActorFromRequest(req);

  try {
    const parsed = upsertResultSchema.safeParse(payload);

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

    const event = await prisma.samplingEvent.findFirst({
      where: { id: eventId, testId: id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: { message: "Sampling event not found." } },
        { status: 404 },
      );
    }

    const previous = await prisma.testResult.findUnique({
      where: { samplingEventId: eventId },
      include: {
        parameterResults: {
          orderBy: [{ group: "asc" }, { parameterKey: "asc" }],
        },
        organolepticPanelists: {
          orderBy: { panelistCode: "asc" },
        },
      },
    });

    const saved = await prisma.$transaction(async (tx) => {
      const result = await tx.testResult.upsert({
        where: { samplingEventId: eventId },
        update: {
          summaryStatus: parsed.data.summaryStatus ?? null,
          deviationNotes: parsed.data.deviationNotes ?? null,
        },
        create: {
          samplingEventId: eventId,
          summaryStatus: parsed.data.summaryStatus ?? null,
          deviationNotes: parsed.data.deviationNotes ?? null,
        },
      });

      await tx.parameterResult.deleteMany({
        where: { testResultId: result.id },
      });
      await tx.organolepticPanelistResult.deleteMany({
        where: { testResultId: result.id },
      });

      if (parsed.data.parameters.length > 0) {
        await tx.parameterResult.createMany({
          data: parsed.data.parameters.map((parameter) => ({
            testResultId: result.id,
            group: parameter.group,
            parameterKey: parameter.parameterKey,
            unit: parameter.unit ?? null,
            normativeText: parameter.normativeText ?? null,
            valueText: parameter.valueText ?? null,
            valueNumber: parameter.valueNumber ?? null,
            passFail: parameter.passFail,
            comment: parameter.comment ?? null,
          })),
        });
      }

      if (parsed.data.panelists.length > 0) {
        await tx.organolepticPanelistResult.createMany({
          data: parsed.data.panelists.map((panelist) => ({
            testResultId: result.id,
            panelistCode: panelist.panelistCode,
            tasteScore: panelist.tasteScore ?? null,
            smellScore: panelist.smellScore ?? null,
            colorScore: panelist.colorScore ?? null,
            homogeneityScore: panelist.homogeneityScore ?? null,
            appearanceScore: panelist.appearanceScore ?? null,
            overallScore: panelist.overallScore ?? null,
            comments: panelist.comments ?? null,
          })),
        });
      }

      return tx.testResult.findUniqueOrThrow({
        where: { id: result.id },
        include: {
          parameterResults: true,
          organolepticPanelists: true,
        },
      });
    });

    const changedFields: string[] = [];
    if ((previous?.summaryStatus ?? null) !== (saved.summaryStatus ?? null)) {
      changedFields.push("summaryStatus");
    }
    if ((previous?.deviationNotes ?? null) !== (saved.deviationNotes ?? null)) {
      changedFields.push("deviationNotes");
    }

    const previousParameters = JSON.stringify(
      (previous?.parameterResults ?? []).map((item) => ({
        group: item.group,
        parameterKey: item.parameterKey,
        valueText: item.valueText,
        valueNumber: item.valueNumber,
        passFail: item.passFail,
        comment: item.comment,
      })),
    );
    const nextParameters = JSON.stringify(
      saved.parameterResults
        .slice()
        .sort((a, b) =>
          `${a.group}:${a.parameterKey}`.localeCompare(
            `${b.group}:${b.parameterKey}`,
          ),
        )
        .map((item) => ({
          group: item.group,
          parameterKey: item.parameterKey,
          valueText: item.valueText,
          valueNumber: item.valueNumber,
          passFail: item.passFail,
          comment: item.comment,
        })),
    );
    if (previousParameters !== nextParameters) {
      changedFields.push("parameters");
    }

    const previousPanelists = JSON.stringify(
      (previous?.organolepticPanelists ?? []).map((item) => ({
        panelistCode: item.panelistCode,
        overallScore: item.overallScore,
        comments: item.comments,
      })),
    );
    const nextPanelists = JSON.stringify(
      saved.organolepticPanelists
        .slice()
        .sort((a, b) => a.panelistCode.localeCompare(b.panelistCode))
        .map((item) => ({
          panelistCode: item.panelistCode,
          overallScore: item.overallScore,
          comments: item.comments,
        })),
    );
    if (previousPanelists !== nextPanelists) {
      changedFields.push("panelists");
    }

    await logActivity({
      shelfLifeTestId: id,
      entityType: "TEST_RESULT",
      entityId: saved.id,
      action: "RESULT_UPDATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        changedFields,
        samplingEventId: eventId,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const parsed = upsertResultSchema.safeParse(payload);
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

      const saved = upsertDevSamplingResult(id, eventId, {
        summaryStatus: parsed.data.summaryStatus,
        deviationNotes: parsed.data.deviationNotes,
        parameters: parsed.data.parameters,
        panelists: parsed.data.panelists,
      });

      if (!saved) {
        return NextResponse.json(
          { error: { message: "Sampling event not found." } },
          { status: 404 },
        );
      }

      await logActivity({
        shelfLifeTestId: id,
        entityType: "TEST_RESULT",
        entityId: saved.id,
        action: "RESULT_UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          changedFields: [
            "summaryStatus",
            "deviationNotes",
            "parameters",
            "panelists",
          ],
          samplingEventId: eventId,
          source: "dev-fallback",
        },
      });

      return NextResponse.json(saved);
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save test result.",
        },
      },
      { status: 500 },
    );
  }
}
