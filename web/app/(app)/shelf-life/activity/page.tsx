"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityFeed } from "@/components/shelf-life/activity/ActivityFeed";
import type {
  ActivityAction,
  ActivityEntityType,
  ApiErrorResponse,
  ShelfLifeActivityLog,
} from "@/lib/shelf-life-types";

type ActivityResponse = {
  items: ShelfLifeActivityLog[];
  nextCursor: string | null;
};

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const actions: Array<ActivityAction | "ALL"> = [
  "ALL",
  "CREATE",
  "UPDATE",
  "GENERATE",
  "RESULT_UPDATE",
  "DELETE",
];
const entityTypes: Array<ActivityEntityType | "ALL"> = [
  "ALL",
  "SHELF_LIFE_TEST",
  "SAMPLING_EVENT",
  "TEST_RESULT",
];

function ShelfLifeActivityPageContent() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<ShelfLifeActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [testId, setTestId] = useState(searchParams.get("testId") ?? "");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState<ActivityAction | "ALL">("ALL");
  const [entityType, setEntityType] = useState<ActivityEntityType | "ALL">(
    "ALL",
  );

  const queryBase = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "30");

    if (testId.trim()) {
      params.set("testId", testId.trim());
    }

    if (actorId.trim()) {
      params.set("actorId", actorId.trim());
    }

    if (action !== "ALL") {
      params.set("action", action);
    }

    if (entityType !== "ALL") {
      params.set("entityType", entityType);
    }

    return params;
  }, [testId, actorId, action, entityType]);

  const loadLogs = useCallback(
    async (append: boolean, cursor?: string | null) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams(queryBase);
        if (cursor) {
          params.set("cursor", cursor);
        }

        const response = await fetch(`/api/shelf-life-activity?${params}`, {
          cache: "no-store",
        });
        const data = await readJsonSafe<ActivityResponse | ApiErrorResponse>(
          response,
        );

        if (!response.ok) {
          throw new Error(
            (data as ApiErrorResponse | null)?.error?.message ||
              `Failed to load activity (HTTP ${response.status}).`,
          );
        }

        const payload = (data as ActivityResponse) ?? {
          items: [],
          nextCursor: null,
        };

        setLogs((prev) =>
          append ? [...prev, ...payload.items] : (payload.items ?? []),
        );
        setNextCursor(payload.nextCursor ?? null);
      } catch (loadError: unknown) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load activity.",
        );
      } finally {
        setLoading(false);
      }
    },
    [queryBase],
  );

  useEffect(() => {
    void loadLogs(false);
  }, [loadLogs]);

  return (
    <main className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Activity Logs
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Audit trail for shelf-life tests, timepoints, and result updates.
          </p>
        </div>
        <Link
          href="/shelf-life"
          className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to shelf-life
        </Link>
      </div>

      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={testId}
            onChange={(event) => setTestId(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Filter by Test ID"
          />
          <input
            value={actorId}
            onChange={(event) => setActorId(event.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Filter by Actor ID"
          />
          <select
            value={action}
            onChange={(event) =>
              setAction(event.target.value as ActivityAction | "ALL")
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {actions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All Actions" : option}
              </option>
            ))}
          </select>
          <select
            value={entityType}
            onChange={(event) =>
              setEntityType(event.target.value as ActivityEntityType | "ALL")
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {entityTypes.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All Entities" : option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void loadLogs(false)}
            disabled={loading}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Apply filters"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTestId("");
              setActorId("");
              setAction("ALL");
              setEntityType("ALL");
            }}
            className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        Activity logs capture who changed what and when for shelf-life records.
      </section>

      <section className="mt-4">
        <ActivityFeed
          logs={logs}
          loading={loading}
          error={error}
          nextCursor={nextCursor}
          onLoadMore={() => void loadLogs(true, nextCursor)}
        />
      </section>
    </main>
  );
}

export default function ShelfLifeActivityPage() {
  return (
    <Suspense
      fallback={
        <main className="py-6">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            Loading activity logs...
          </div>
        </main>
      }
    >
      <ShelfLifeActivityPageContent />
    </Suspense>
  );
}
