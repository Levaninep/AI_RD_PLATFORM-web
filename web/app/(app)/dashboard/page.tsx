import Link from "next/link";
import { headers } from "next/headers";

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

type Ingredient = {
  id: string;
  name: string;
  updatedAt: string;
};

type Formulation = {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
};

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  actorName: string | null;
  createdAt: string;
};

function toIsoString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseIngredient(candidate: unknown): Ingredient | null {
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }

  const row = candidate as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const name =
    typeof row.ingredientName === "string"
      ? row.ingredientName
      : typeof row.name === "string"
        ? row.name
        : "";
  const updatedAt = toIsoString(row.updatedAt);

  if (!id || !name || !updatedAt) {
    return null;
  }

  return { id, name, updatedAt };
}

function parseFormulation(candidate: unknown): Formulation | null {
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }

  const row = candidate as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const name = typeof row.name === "string" ? row.name : "";
  const category = typeof row.category === "string" ? row.category : "";
  const updatedAt = toIsoString(row.updatedAt);

  if (!id || !name || !category || !updatedAt) {
    return null;
  }

  return { id, name, category, updatedAt };
}

function parseActivity(candidate: unknown): ActivityItem | null {
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }

  const row = candidate as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  const action = typeof row.action === "string" ? row.action : "";
  const entityType = typeof row.entityType === "string" ? row.entityType : "";
  const actorName = typeof row.actorName === "string" ? row.actorName : null;
  const createdAt = toIsoString(row.createdAt);

  if (!id || !action || !entityType || !createdAt) {
    return null;
  }

  return { id, action, entityType, actorName, createdAt };
}

function relativeTime(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(1, Math.floor((now - target) / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function toSentenceCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

async function getBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

async function getRequestCookieHeader(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("cookie");
}

async function fetchJson(
  baseUrl: string,
  path: string,
  cookieHeader?: string | null,
  options?: { allowUnauthorized?: boolean },
): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  const maybeError = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null;

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (options?.allowUnauthorized) {
    const message = (maybeError?.error?.message ?? "").toLowerCase();
    const isAuthLikeStatus = response.status === 401 || response.status === 403;
    const isAuthLikeMessage = message.includes("unauthorized");

    if (isAuthLikeStatus || isAuthLikeMessage) {
      return null;
    }
  }

  if (!response.ok) {
    throw new Error(
      maybeError?.error?.message
        ? `${maybeError.error.message} (${path})`
        : `Request to ${path} failed with HTTP ${response.status}`,
    );
  }

  return maybeError;
}

async function fetchOptionalJson(
  baseUrl: string,
  path: string,
  cookieHeader?: string | null,
): Promise<unknown | null> {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null);
}

export default async function DashboardPage() {
  try {
    const baseUrl = await getBaseUrl();
    const cookieHeader = await getRequestCookieHeader();

    const [ingredientsRaw, formulationsRaw, activityRaw] = await Promise.all([
      fetchJson(baseUrl, "/api/ingredients", cookieHeader, {
        allowUnauthorized: true,
      }),
      fetchJson(baseUrl, "/api/formulations", cookieHeader, {
        allowUnauthorized: true,
      }),
      fetchOptionalJson(
        baseUrl,
        "/api/shelf-life-activity?limit=8",
        cookieHeader,
      ),
    ]);

    const ingredientsPayload =
      typeof ingredientsRaw === "object" && ingredientsRaw !== null
        ? (ingredientsRaw as Record<string, unknown>)
        : null;

    const ingredientRows = Array.isArray(ingredientsRaw)
      ? ingredientsRaw
      : Array.isArray(ingredientsPayload?.items)
        ? ingredientsPayload.items
        : [];

    const ingredients = ingredientRows
      .map(parseIngredient)
      .filter((item): item is Ingredient => item !== null);

    const formulations = Array.isArray(formulationsRaw)
      ? formulationsRaw
          .map(parseFormulation)
          .filter((item): item is Formulation => item !== null)
      : [];

    const activityPayload =
      typeof activityRaw === "object" && activityRaw !== null
        ? (activityRaw as Record<string, unknown>)
        : null;

    const activityItems = Array.isArray(activityPayload?.items)
      ? activityPayload.items
          .map(parseActivity)
          .filter((item): item is ActivityItem => item !== null)
          .slice(0, 6)
      : [];

    const recentFormulations = [...formulations]
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )
      .slice(0, 6);

    return (
      <main>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor current R&D workflows, recent updates, and launch core
              tasks quickly.
            </p>
          </div>

          <Link
            href="/formulations"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New Formulation
          </Link>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ingredients
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {ingredients.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Items in ingredients database
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Formulations
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formulations.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Active formulation records
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Activity Entries
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {activityItems.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Most recent quality and process changes
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Current Focus
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              Specs → Cost → Shelf-life
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Recommended validation order for each formula
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500">Start common workflows</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href="/ingredients"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              New Ingredient
            </Link>
            <Link
              href="/formulations"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              New Formulation
            </Link>
            <Link
              href="/shelf-life/new"
              className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              New Shelf-life Test
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Recent Activity
              </h2>
              <Link
                href="/shelf-life/activity"
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                View logs
              </Link>
            </div>

            {activityItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                No activity recorded yet.
                <div className="mt-2">
                  <Link
                    href="/shelf-life"
                    className="font-medium text-blue-700 hover:text-blue-800"
                  >
                    Create first shelf-life test
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {activityItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {toSentenceCase(item.action)} ·{" "}
                      {toSentenceCase(item.entityType)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.actorName ?? "System"} ·{" "}
                      {relativeTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Recently Edited Formulations
              </h2>
              <Link
                href="/formulations"
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Open formulations
              </Link>
            </div>

            {recentFormulations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                No formulations yet.
                <div className="mt-2">
                  <Link
                    href="/formulations"
                    className="font-medium text-blue-700 hover:text-blue-800"
                  >
                    Create first formulation
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentFormulations.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.category} · {relativeTime(item.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor current R&D workflows, recent updates, and launch core
              tasks quickly.
            </p>
          </div>

          <Link
            href="/formulations"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            New Formulation
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(error as Error)?.message || "Failed to load dashboard data."}
        </div>
      </main>
    );
  }
}
