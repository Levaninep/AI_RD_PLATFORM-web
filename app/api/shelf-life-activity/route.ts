import { Prisma } from "@/generated/prisma/client/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/dev-data-store";
import { env } from "@/lib/env";
import {
  listDevActivityLogs,
  type ActivityAction,
  type ActivityEntityType,
} from "@/lib/dev-activity-store";

const actions: ActivityAction[] = [
  "CREATE",
  "UPDATE",
  "GENERATE",
  "RESULT_UPDATE",
  "DELETE",
];
const entityTypes: ActivityEntityType[] = [
  "SHELF_LIFE_TEST",
  "SAMPLING_EVENT",
  "TEST_RESULT",
  "FORMULATION",
  "FORMULATION_LINE",
];

type ActivityLogRow = {
  id: string;
  shelfLifeTestId: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const shelfLifeTestId = searchParams.get("testId") ?? undefined;
  const actorId = searchParams.get("actorId") ?? undefined;
  const actionParam = searchParams.get("action");
  const entityTypeParam = searchParams.get("entityType");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const cursorParam = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");

  const action =
    actionParam && actions.includes(actionParam as ActivityAction)
      ? (actionParam as ActivityAction)
      : undefined;
  const entityType =
    entityTypeParam &&
    entityTypes.includes(entityTypeParam as ActivityEntityType)
      ? (entityTypeParam as ActivityEntityType)
      : undefined;

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;
  const cursor = cursorParam ? new Date(cursorParam) : undefined;
  const limit = Math.min(Math.max(Number(limitParam ?? "50") || 50, 1), 100);

  if (
    (from && Number.isNaN(from.getTime())) ||
    (to && Number.isNaN(to.getTime())) ||
    (cursor && Number.isNaN(cursor.getTime()))
  ) {
    return NextResponse.json(
      { error: { message: "Invalid date filter." } },
      { status: 400 },
    );
  }

  try {
    const whereParts: Prisma.Sql[] = [];

    if (shelfLifeTestId) {
      whereParts.push(Prisma.sql`"shelfLifeTestId" = ${shelfLifeTestId}`);
    }

    if (actorId) {
      whereParts.push(Prisma.sql`"actorId" = ${actorId}`);
    }

    if (action) {
      whereParts.push(Prisma.sql`"action" = ${action}::"ActivityAction"`);
    }

    if (entityType) {
      whereParts.push(
        Prisma.sql`"entityType" = ${entityType}::"ActivityEntityType"`,
      );
    }

    if (from) {
      whereParts.push(Prisma.sql`"createdAt" >= ${from}`);
    }

    if (to) {
      whereParts.push(Prisma.sql`"createdAt" <= ${to}`);
    }

    if (cursor) {
      whereParts.push(Prisma.sql`"createdAt" < ${cursor}`);
    }

    const whereClause = whereParts.length
      ? Prisma.sql`WHERE ${Prisma.join(whereParts, " AND ")}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<ActivityLogRow[]>(Prisma.sql`
      SELECT
        "id",
        "shelfLifeTestId",
        "entityType",
        "entityId",
        "action",
        "actorId",
        "actorName",
        "metadata",
        "createdAt"
      FROM "ActivityLog"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT ${limit + 1}
    `);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
      ? (items[items.length - 1]?.createdAt?.toISOString() ?? null)
      : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    if (isDatabaseUnavailable(error) || !env.isProduction) {
      const fallback = listDevActivityLogs({
        shelfLifeTestId,
        actorId,
        action,
        entityType,
        from,
        to,
        cursor,
        limit,
      });

      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load activity logs.",
        },
      },
      { status: 500 },
    );
  }
}
