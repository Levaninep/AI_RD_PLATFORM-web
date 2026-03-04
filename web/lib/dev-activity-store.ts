export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "GENERATE"
  | "RESULT_UPDATE"
  | "DELETE";

export type ActivityEntityType =
  | "SHELF_LIFE_TEST"
  | "SAMPLING_EVENT"
  | "TEST_RESULT"
  | "FORMULATION"
  | "FORMULATION_LINE";

export type DevActivityLog = {
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

type DevActivityStore = {
  logs: DevActivityLog[];
};

const globalStore = globalThis as unknown as {
  __devActivityStore?: DevActivityStore;
};

const store: DevActivityStore = globalStore.__devActivityStore ?? { logs: [] };
if (!globalStore.__devActivityStore) {
  globalStore.__devActivityStore = store;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function addDevActivityLog(input: {
  shelfLifeTestId?: string | null;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const log: DevActivityLog = {
    id: createId("act"),
    shelfLifeTestId: input.shelfLifeTestId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  };

  store.logs.unshift(log);
  return log;
}

export function listDevActivityLogs(filters?: {
  shelfLifeTestId?: string;
  actorId?: string;
  action?: ActivityAction;
  entityType?: ActivityEntityType;
  from?: Date;
  to?: Date;
  cursor?: Date;
  limit?: number;
}) {
  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);

  const filtered = store.logs
    .filter((log) => {
      if (
        filters?.shelfLifeTestId &&
        log.shelfLifeTestId !== filters.shelfLifeTestId
      ) {
        return false;
      }

      if (filters?.actorId && log.actorId !== filters.actorId) {
        return false;
      }

      if (filters?.action && log.action !== filters.action) {
        return false;
      }

      if (filters?.entityType && log.entityType !== filters.entityType) {
        return false;
      }

      if (filters?.from && log.createdAt < filters.from) {
        return false;
      }

      if (filters?.to && log.createdAt > filters.to) {
        return false;
      }

      if (filters?.cursor && log.createdAt >= filters.cursor) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const items = filtered.slice(0, limit);
  const nextCursor =
    filtered.length > limit
      ? items[items.length - 1]?.createdAt.toISOString()
      : null;

  return {
    items,
    nextCursor,
  };
}
