import Link from "next/link";
import { headers } from "next/headers";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Beaker,
  ChevronRight,
  ClipboardList,
  Clock3,
  FlaskConical,
  Plus,
  Sparkles,
  TestTube2,
  TrendingUp,
} from "lucide-react";

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

    const latestFormulation = recentFormulations[0];
    const commandIngredients = ingredients.slice(0, 4);
    const commandActivity = activityItems.slice(0, 3);
    const commandFormulations = recentFormulations.slice(0, 3);

    return (
      <main className="dashboard-shell rounded-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
              Dashboard
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 md:text-[15px]">
              Monitor active R&D workflows, formulation changes, and validation
              signals from one command surface.
            </p>
          </div>

          <Link href="/formulations" className="dashboard-cta-button">
            <Plus className="size-4" />
            New Formulation
          </Link>
        </div>

        <section className="dashboard-card-dark mt-7 p-3 md:p-4">
          <div className="rounded-xl border border-white/10 bg-[#122240] px-3 py-2.5 md:px-4">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-200 md:text-xs">
              <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 font-semibold tracking-wide text-white">
                <span className="size-2 rounded-full bg-blue-400" />
                R&D
              </div>
              <p className="font-medium text-slate-300">Command Center</p>
              <p className="text-slate-400">Current focus pipeline</p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-6">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                Active Formulations
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-white">
                {formulations.length}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                Avg Product Cost
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-white">
                €0.37/L
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                Avg Brix
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-white">10.6</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                Shelf-life Status
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-white">
                Running
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                Current Focus
              </p>
              <p className="mt-1.5 text-lg font-semibold text-white">
                Specs -&gt; Cost -&gt; Shelf-life
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[270px_minmax(0,1fr)_300px]">
            <div className="space-y-3">
              <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Ingredient Cost
                  </h3>
                  <BadgeDollarSign className="size-4 text-slate-300" />
                </div>
                <div className="space-y-2">
                  {(commandIngredients.length
                    ? commandIngredients
                    : [
                        {
                          id: "a",
                          name: "Juice",
                          updatedAt: new Date().toISOString(),
                        },
                        {
                          id: "b",
                          name: "Sugar",
                          updatedAt: new Date().toISOString(),
                        },
                        {
                          id: "c",
                          name: "Citrus Acid",
                          updatedAt: new Date().toISOString(),
                        },
                        {
                          id: "d",
                          name: "Natural Flavor",
                          updatedAt: new Date().toISOString(),
                        },
                      ]
                  ).map((item, index) => (
                    <div key={item.id}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                        <span>{item.name}</span>
                        <span>{Math.max(8, 34 - index * 7)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-blue-400"
                          style={{ width: `${Math.max(12, 68 - index * 14)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Active R&D Experiments
                </h3>
                <div className="mt-3 flex items-center gap-4">
                  <div
                    className="size-16 rounded-full border border-white/10"
                    style={{
                      background:
                        "conic-gradient(#3b82f6 0 42%, #22c55e 42% 66%, #f59e0b 66% 84%, #1e293b 84% 100%)",
                    }}
                  />
                  <div className="space-y-1 text-xs text-slate-300">
                    <p>Stability 42%</p>
                    <p>Sensory 24%</p>
                    <p>Cost 18%</p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Pending Validations
                  </h3>
                  <Clock3 className="size-4 text-slate-300" />
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                    <span>Specs Stress Test</span>
                    <span>Needs QA</span>
                  </p>
                  <p className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                    <span>Acidity Hold</span>
                    <span>Review</span>
                  </p>
                  <p className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                    <span>Sensory Benchmark</span>
                    <span>Pending</span>
                  </p>
                </div>
              </article>
            </div>

            <article className="dashboard-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Formula snapshot
                  </p>
                  <h3 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">
                    {latestFormulation?.name ?? "Orange Juice Formula"}
                  </h3>
                </div>
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Pressure edition
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_250px]">
                <div className="space-y-2.5">
                  {(commandIngredients.length
                    ? commandIngredients
                    : [
                        {
                          id: "x1",
                          name: "Juice",
                          updatedAt: new Date().toISOString(),
                        },
                        {
                          id: "x2",
                          name: "Sugar",
                          updatedAt: new Date().toISOString(),
                        },
                        {
                          id: "x3",
                          name: "Citrus Acid",
                          updatedAt: new Date().toISOString(),
                        },
                        {
                          id: "x4",
                          name: "Natural Flavor",
                          updatedAt: new Date().toISOString(),
                        },
                      ]
                  ).map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5"
                    >
                      <div className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                        <span>{item.name}</span>
                        <span>{Math.max(3, 90 - index * 28)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${Math.max(12, 92 - index * 26)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Technical Parameters
                  </p>
                  <p className="mt-3 text-4xl font-semibold leading-none text-slate-900">
                    11.2
                    <span className="ml-1 text-lg text-slate-500">Bx</span>
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center justify-between">
                      <span>pH</span>
                      <span className="font-semibold text-slate-800">3.6</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Density</span>
                      <span className="font-semibold text-slate-800">
                        1.03 g/ml
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Stability Index</span>
                      <span className="font-semibold text-slate-800">
                        C2.41
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Optimize Cost
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                  Simulate Shelf-life
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                  AI Improve Recipe
                </button>
              </div>
            </article>

            <div className="space-y-3">
              <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Cost Structure
                  </h3>
                  <TrendingUp className="size-4 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-1.5 w-4/5 rounded-full bg-blue-400" />
                  </div>
                  <div className="h-20 rounded-lg border border-white/10 bg-white/5 p-2">
                    <div className="flex h-full items-end gap-1">
                      {[25, 32, 42, 50, 58, 64, 71, 79].map((value) => (
                        <div
                          key={value}
                          className="flex-1 rounded-sm bg-blue-400/60"
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Test Manager
                </h3>
                <div className="mt-2 space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                    <span>Processed Orange Cost</span>
                    <span>1.65 /L</span>
                  </p>
                  <p className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5">
                    <span>Patch COG</span>
                    <span>0.90 /L</span>
                  </p>
                </div>
                <button className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15">
                  Add new project <ChevronRight className="size-3.5" />
                </button>
              </article>

              <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  Recent Activity
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {(commandActivity.length ? commandActivity : activityItems)
                    .slice(0, 3)
                    .map((item) => (
                      <li
                        key={item.id}
                        className="rounded-md bg-white/5 px-2 py-1.5"
                      >
                        <p className="text-xs font-medium text-slate-100">
                          {toSentenceCase(item.action)} ·{" "}
                          {toSentenceCase(item.entityType)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          {item.actorName ?? "System"} ·{" "}
                          {relativeTime(item.createdAt)}
                        </p>
                      </li>
                    ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="dashboard-kpi-card group hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Ingredients
              </p>
              <Beaker className="size-4 text-blue-600" />
            </div>
            <p className="mt-3 text-4xl font-semibold leading-none text-slate-900">
              {ingredients.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Items in ingredients database
            </p>
          </article>

          <article className="dashboard-kpi-card group hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Formulations
              </p>
              <FlaskConical className="size-4 text-blue-600" />
            </div>
            <p className="mt-3 text-4xl font-semibold leading-none text-slate-900">
              {formulations.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Active formulation records
            </p>
          </article>

          <article className="dashboard-kpi-card group hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Activity Entries
              </p>
              <ClipboardList className="size-4 text-blue-600" />
            </div>
            <p className="mt-3 text-4xl font-semibold leading-none text-slate-900">
              {activityItems.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Most recent quality and process changes
            </p>
          </article>

          <article className="dashboard-kpi-card border-blue-100 bg-linear-to-b from-white to-blue-50/40 group hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                Current Focus
              </p>
              <Sparkles className="size-4 text-blue-600" />
            </div>
            <p className="mt-3 text-xl font-semibold text-slate-900">
              Specs -&gt; Cost -&gt; Shelf-life
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Recommended validation order for each formula iteration.
            </p>
          </article>
        </section>

        <section className="dashboard-card mt-6 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="dashboard-section-title">Quick Actions</h2>
            <p className="text-xs font-medium text-slate-500">
              Start common workflows
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Link href="/ingredients" className="dashboard-action-button">
              <span className="inline-flex items-center gap-2">
                <Beaker className="size-4 text-blue-600" />
                New Ingredient
              </span>
              <ArrowRight className="size-4 text-slate-400" />
            </Link>

            <Link href="/formulations" className="dashboard-action-button">
              <span className="inline-flex items-center gap-2">
                <FlaskConical className="size-4 text-blue-600" />
                New Formulation
              </span>
              <ArrowRight className="size-4 text-slate-400" />
            </Link>

            <Link href="/shelf-life/new" className="dashboard-action-button">
              <span className="inline-flex items-center gap-2">
                <TestTube2 className="size-4 text-blue-600" />
                New Shelf-life Test
              </span>
              <ArrowRight className="size-4 text-slate-400" />
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <article className="dashboard-card p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="dashboard-section-title">Recent Activity</h2>
              <Link href="/shelf-life/activity" className="dashboard-link">
                View logs
              </Link>
            </div>

            {activityItems.length === 0 ? (
              <div className="dashboard-row-item border-dashed text-sm text-slate-500">
                No activity recorded yet.
                <div className="mt-2">
                  <Link href="/shelf-life" className="dashboard-link text-sm">
                    Create first shelf-life test
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {activityItems.slice(0, 3).map((item) => (
                  <li key={item.id} className="dashboard-row-item">
                    <p className="text-sm font-semibold text-slate-900">
                      {toSentenceCase(item.action)} ·{" "}
                      {toSentenceCase(item.entityType)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {item.actorName ?? "System"} ·{" "}
                      {relativeTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="dashboard-card p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="dashboard-section-title">
                Recently Edited Formulations
              </h2>
              <Link href="/formulations" className="dashboard-link">
                Open formulations
              </Link>
            </div>

            {recentFormulations.length === 0 ? (
              <div className="dashboard-row-item border-dashed text-sm text-slate-500">
                No formulations yet.
                <div className="mt-2">
                  <Link href="/formulations" className="dashboard-link text-sm">
                    Create first formulation
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {(commandFormulations.length
                  ? commandFormulations
                  : recentFormulations
                )
                  .slice(0, 3)
                  .map((item) => (
                    <li key={item.id} className="dashboard-row-item">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
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
      <main className="dashboard-shell rounded-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
              Dashboard
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 md:text-[15px]">
              Monitor current R&D workflows, recent updates, and launch core
              tasks quickly.
            </p>
          </div>

          <Link href="/formulations" className="dashboard-cta-button">
            <Plus className="size-4" />
            New Formulation
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(error as Error)?.message || "Failed to load dashboard data."}
        </div>
      </main>
    );
  }
}
