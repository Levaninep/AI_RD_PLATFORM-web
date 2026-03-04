import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateEventStatusSchema } from "@/lib/shelf-life";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { updateDevSamplingEvent } from "@/lib/dev-shelf-life-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  const payload = await req.json().catch(() => null);
  const { id, eventId } = await params;
  const actor = getActivityActorFromRequest(req);

  try {
    const parsed = updateEventStatusSchema.safeParse(payload);

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
      select: { id: true, status: true, sampleCode: true, notes: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: { message: "Sampling event not found." } },
        { status: 404 },
      );
    }

    const updated = await prisma.samplingEvent.update({
      where: { id: eventId },
      data: {
        status: parsed.data.status,
        sampleCode: parsed.data.sampleCode ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    const changedFields: string[] = [];
    if (event.status !== updated.status) changedFields.push("status");
    if (event.sampleCode !== updated.sampleCode)
      changedFields.push("sampleCode");
    if (event.notes !== updated.notes) changedFields.push("notes");

    await logActivity({
      shelfLifeTestId: id,
      entityType: "SAMPLING_EVENT",
      entityId: eventId,
      action: "UPDATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        changedFields,
        dayOffset: updated.dayOffset,
        type: updated.type,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const parsed = updateEventStatusSchema.safeParse(payload);
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

      const updated = updateDevSamplingEvent(id, eventId, {
        status: parsed.data.status,
        sampleCode: parsed.data.sampleCode,
        notes: parsed.data.notes,
      });

      if (!updated) {
        return NextResponse.json(
          { error: { message: "Sampling event not found." } },
          { status: 404 },
        );
      }

      await logActivity({
        shelfLifeTestId: id,
        entityType: "SAMPLING_EVENT",
        entityId: eventId,
        action: "UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          changedFields: ["status", "sampleCode", "notes"],
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
              : "Failed to update sampling event.",
        },
      },
      { status: 500 },
    );
  }
}
