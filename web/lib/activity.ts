import { Prisma } from "@/generated/prisma/client/client";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  addDevActivityLog,
  type ActivityAction,
  type ActivityEntityType,
} from "@/lib/dev-activity-store";

type ActivityActor = {
  actorId?: string | null;
  actorName?: string | null;
};

const MAX_METADATA_STRING_LENGTH = 3800;

function createActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function sanitizeMetadata(
  metadata?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }

  try {
    const serialized = JSON.stringify(metadata);
    if (!serialized) {
      return null;
    }

    if (serialized.length <= MAX_METADATA_STRING_LENGTH) {
      return metadata;
    }

    return {
      truncated: true,
      note: "metadata exceeded size limit",
      preview: serialized.slice(0, MAX_METADATA_STRING_LENGTH),
    };
  } catch {
    return {
      truncated: true,
      note: "metadata serialization failed",
    };
  }
}

export function getActivityActorFromRequest(req: Request): ActivityActor {
  const actorId =
    req.headers.get("x-user-id") ??
    req.headers.get("x-actor-id") ??
    req.headers.get("x-user") ??
    null;
  const actorName =
    req.headers.get("x-user-name") ?? req.headers.get("x-actor-name") ?? null;

  return {
    actorId,
    actorName: actorName || actorId || "System",
  };
}

export async function logActivity(input: {
  shelfLifeTestId?: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const safeMetadata = sanitizeMetadata(input.metadata);

  try {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "ActivityLog"
          ("id", "shelfLifeTestId", "entityType", "entityId", "action", "actorId", "actorName", "metadata", "createdAt")
        VALUES
          (
            ${createActivityId()},
            ${input.shelfLifeTestId ?? null},
            ${input.entityType}::"ActivityEntityType",
            ${input.entityId},
            ${input.action}::"ActivityAction",
            ${input.actorId ?? null},
            ${input.actorName ?? null},
            ${safeMetadata ? JSON.stringify(safeMetadata) : null}::jsonb,
            NOW()
          )
      `,
    );
  } catch (error) {
    if (isDatabaseUnavailable(error) || !env.isProduction) {
      addDevActivityLog({
        shelfLifeTestId: input.shelfLifeTestId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actorId,
        actorName: input.actorName,
        metadata: safeMetadata,
      });
      return;
    }
  }
}
