import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  Beaker,
  ClipboardList,
  FlaskConical,
  Plus,
} from "lucide-react";
import { type DashboardFormulaSnapshot } from "@/components/dashboard/FormulaSnapshotCard";

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
  targetBrix: number | null;
  targetPH: number | null;
  co2GPerL: number | null;
  desiredBrix: number | null;
  temperatureC: number | null;
  correctedBrix: number | null;
  densityGPerML: number | null;
  targetMassPerLiterG: number | null;
  waterGramsPerLiter: number | null;
  totalGrams: number;
  totalCostUSD: number;
  costPerKgUSD: number;
  createdAt: string;
  updatedAt: string;
  ingredients: Array<{
    id: string;
    dosageGrams: number;
    priceOverridePerKg: number | null;
    ingredient: {
      id: string;
      name: string;
      pricePerKgEur: number | null;
      pricePerKg: number | null;
    };
  }>;
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

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
  const category =
    typeof row.category === "string" ? row.category : "Uncategorized";
  const createdAt = toIsoString(row.createdAt);
  const updatedAt = toIsoString(row.updatedAt);

  const ingredients = Array.isArray(row.ingredients)
    ? row.ingredients
        .map((line) => {
          if (typeof line !== "object" || line === null) {
            return null;
          }

          const item = line as Record<string, unknown>;
          const ingredientCandidate =
            typeof item.ingredient === "object" && item.ingredient !== null
              ? (item.ingredient as Record<string, unknown>)
              : null;

          const ingredientId =
            typeof ingredientCandidate?.id === "string"
              ? ingredientCandidate.id
              : "";
          const ingredientName =
            typeof ingredientCandidate?.name === "string"
              ? ingredientCandidate.name
              : typeof ingredientCandidate?.ingredientName === "string"
                ? ingredientCandidate.ingredientName
                : "";
          const dosageGrams = toNullableNumber(item.dosageGrams);

          if (!ingredientId || !ingredientName || dosageGrams === null) {
            return null;
          }

          return {
            id: typeof item.id === "string" ? item.id : `${id}:${ingredientId}`,
            dosageGrams,
            priceOverridePerKg: toNullableNumber(item.priceOverridePerKg),
            ingredient: {
              id: ingredientId,
              name: ingredientName,
              pricePerKgEur: toNullableNumber(
                ingredientCandidate?.pricePerKgEur,
              ),
              pricePerKg: toNullableNumber(ingredientCandidate?.pricePerKg),
            },
          };
        })
        .filter(
          (
            line,
          ): line is {
            id: string;
            dosageGrams: number;
            priceOverridePerKg: number | null;
            ingredient: {
              id: string;
              name: string;
              pricePerKgEur: number | null;
              pricePerKg: number | null;
            };
          } => line !== null,
        )
    : [];

  if (!id || !name || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id,
    name,
    category,
    targetBrix: toNullableNumber(row.targetBrix),
    targetPH: toNullableNumber(row.targetPH),
    co2GPerL: toNullableNumber(row.co2GPerL),
    desiredBrix: toNullableNumber(row.desiredBrix),
    temperatureC: toNullableNumber(row.temperatureC),
    correctedBrix: toNullableNumber(row.correctedBrix),
    densityGPerML: toNullableNumber(row.densityGPerML),
    targetMassPerLiterG: toNullableNumber(row.targetMassPerLiterG),
    waterGramsPerLiter: toNullableNumber(row.waterGramsPerLiter),
    totalGrams:
      toNullableNumber(row.totalGrams) ??
      ingredients.reduce((sum, line) => sum + line.dosageGrams, 0),
    totalCostUSD: toNullableNumber(row.totalCostUSD) ?? 0,
    costPerKgUSD: toNullableNumber(row.costPerKgUSD) ?? 0,
    createdAt,
    updatedAt,
    ingredients,
  };
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
    const latestFormulationSnapshot: DashboardFormulaSnapshot | null =
      latestFormulation
        ? {
            id: latestFormulation.id,
            name: latestFormulation.name,
            category: latestFormulation.category,
            targetBrix: latestFormulation.targetBrix,
            targetPH: latestFormulation.targetPH,
            co2GPerL: latestFormulation.co2GPerL,
            desiredBrix: latestFormulation.desiredBrix,
            temperatureC: latestFormulation.temperatureC,
            correctedBrix: latestFormulation.correctedBrix,
            densityGPerML: latestFormulation.densityGPerML,
            targetMassPerLiterG: latestFormulation.targetMassPerLiterG,
            waterGramsPerLiter: latestFormulation.waterGramsPerLiter,
            totalGrams: latestFormulation.totalGrams,
            totalCostUSD: latestFormulation.totalCostUSD,
            costPerKgUSD: latestFormulation.costPerKgUSD,
            createdAt: latestFormulation.createdAt,
            updatedAt: latestFormulation.updatedAt,
            ingredients: latestFormulation.ingredients,
          }
        : null;
    const commandFormulations = recentFormulations.slice(0, 3);

    // Per-user KPI: unique ingredients used across all user's formulations
    const usedIngredientIds = new Set<string>();
    for (const f of formulations) {
      for (const line of f.ingredients) {
        usedIngredientIds.add(line.ingredient.id);
      }
    }
    const usedIngredientsCount = usedIngredientIds.size;

    return (
      <main className="dashboard-shell">
        {/* Background decorations */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-150 w-150 rounded-full bg-[#3B5BFF]/15 blur-3xl" />
          <div className="absolute -left-20 top-1/3 h-100 w-100 rounded-full bg-[#3B5BFF]/10 blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 h-75 w-75 rounded-full bg-[#3B5BFF]/5 blur-[120px]" />
        </div>

        {/* Hero section */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">
              Welcome back, Levan
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Overview your R&D activity and formulation progress.
            </p>
          </div>

          <Link href="/formulations" className="dashboard-cta-button">
            <Plus className="size-4" />
            New Formulation
          </Link>
        </div>

        {/* Last Formula Card */}
        <section className="dashboard-card-dark relative mt-8 p-5 md:p-6">
          <div className="rounded-xl border border-white/10 bg-[#1D32B8]/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 font-semibold tracking-wide text-white">
                <span className="size-2 rounded-full bg-[#3B5BFF]" />
                R&D
              </div>
              <p className="font-medium text-slate-300">Latest Formula</p>
              <p className="text-slate-400">Last generated formulation</p>
            </div>
          </div>

          {latestFormulation ? (
            <>
              {/* Formula header */}
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {latestFormulation.name}
                  </h2>
                  <p className="mt-1 text-sm text-blue-200/70">
                    {latestFormulation.category} · updated{" "}
                    {relativeTime(latestFormulation.updatedAt)}
                  </p>
                </div>
                <Link
                  href="/saved-formulas"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Parameters grid */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {latestFormulation.targetBrix != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      Target Brix
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.targetBrix.toFixed(1)}{" "}
                      <span className="text-base font-medium text-blue-200/60">
                        Bx
                      </span>
                    </p>
                  </div>
                )}
                {latestFormulation.correctedBrix != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      Corrected Brix
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.correctedBrix.toFixed(1)}{" "}
                      <span className="text-base font-medium text-blue-200/60">
                        Bx
                      </span>
                    </p>
                  </div>
                )}
                {latestFormulation.targetPH != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      pH
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.targetPH.toFixed(2)}
                    </p>
                  </div>
                )}
                {latestFormulation.co2GPerL != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      CO₂
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.co2GPerL.toFixed(2)}{" "}
                      <span className="text-base font-medium text-blue-200/60">
                        g/L
                      </span>
                    </p>
                  </div>
                )}
                {latestFormulation.densityGPerML != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      Density
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.densityGPerML.toFixed(3)}{" "}
                      <span className="text-base font-medium text-blue-200/60">
                        g/ml
                      </span>
                    </p>
                  </div>
                )}
                {latestFormulation.temperatureC != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      Temperature
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.temperatureC.toFixed(1)}{" "}
                      <span className="text-base font-medium text-blue-200/60">
                        °C
                      </span>
                    </p>
                  </div>
                )}
                {latestFormulation.waterGramsPerLiter != null && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      Water / L
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {latestFormulation.waterGramsPerLiter.toFixed(0)}{" "}
                      <span className="text-base font-medium text-blue-200/60">
                        g
                      </span>
                    </p>
                  </div>
                )}
                {latestFormulation.totalCostUSD > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                      Batch Cost
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      ${latestFormulation.totalCostUSD.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Ingredient breakdown */}
              {latestFormulation.ingredients.length > 0 && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-blue-200/70">
                    Ingredients ({latestFormulation.ingredients.length})
                  </p>
                  <div className="mt-3 space-y-2">
                    {[...latestFormulation.ingredients]
                      .sort((a, b) => b.dosageGrams - a.dosageGrams)
                      .map((ing) => {
                        const totalG =
                          latestFormulation.totalGrams > 0
                            ? latestFormulation.totalGrams
                            : latestFormulation.ingredients.reduce(
                                (s, i) => s + i.dosageGrams,
                                0,
                              );
                        const pct =
                          totalG > 0
                            ? ((ing.dosageGrams / totalG) * 100).toFixed(1)
                            : "0";
                        return (
                          <div key={ing.id} className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="truncate font-medium text-white">
                                  {ing.ingredient.name}
                                </span>
                                <span className="shrink-0 text-blue-200/70">
                                  {ing.dosageGrams.toFixed(1)}g · {pct}%
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-white/10">
                                <div
                                  className="h-1.5 rounded-full bg-[#3B5BFF]"
                                  style={{
                                    width: `${Math.max(4, Math.min(Number(pct), 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center">
              <FlaskConical className="mx-auto size-8 text-blue-200/50" />
              <p className="mt-3 text-sm font-medium text-blue-200/70">
                No formulations yet
              </p>
              <p className="mt-1 text-xs text-blue-200/50">
                Create your first formulation to see its parameters here.
              </p>
              <Link
                href="/formulations"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Plus className="size-4" />
                New Formulation
              </Link>
            </div>
          )}
        </section>

        {/* Transition overlay */}
        <div
          className="pointer-events-none absolute inset-x-0 -z-5"
          style={{
            top: "calc(100% - 1rem)",
            height: "8rem",
            background:
              "radial-gradient(ellipse 150% 100% at 50% 0%, rgba(29,50,184,0.25) 0%, rgba(59,91,255,0.1) 40%, transparent 100%)",
          }}
        />

        {/* Secondary KPI Grid */}
        <section className="mt-7 grid gap-5 sm:grid-cols-3">
          <article className="dashboard-kpi-card group">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                My Formulas
              </p>
              <FlaskConical className="size-5 text-[#3B5BFF]" />
            </div>
            <p className="mt-4 text-5xl font-bold leading-none text-slate-900">
              {formulations.length}
            </p>
            <p className="mt-2 text-sm text-slate-400">Formulas you created</p>
          </article>

          <article className="dashboard-kpi-card group">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Ingredient Library
              </p>
              <Beaker className="size-5 text-[#3B5BFF]" />
            </div>
            <p className="mt-4 text-5xl font-bold leading-none text-slate-900">
              {ingredients.length}
            </p>
            <p className="mt-2 text-sm text-slate-400">Available ingredients</p>
          </article>

          <article className="dashboard-kpi-card group">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Ingredients in Use
              </p>
              <ClipboardList className="size-5 text-[#3B5BFF]" />
            </div>
            <p className="mt-4 text-5xl font-bold leading-none text-slate-900">
              {usedIngredientsCount}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Unique ingredients in your formulas
            </p>
          </article>
        </section>

        {/* Recent Activity */}
        <section className="dashboard-card mt-7 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="dashboard-section-title">Recent Activity</h2>
            <Link href="/shelf-life/activity" className="dashboard-link">
              Start common workflows
            </Link>
          </div>

          {activityItems.length === 0 ? (
            <div className="dashboard-row-item border-dashed text-sm text-slate-400">
              No activity recorded yet.
              <div className="mt-2">
                <Link href="/shelf-life" className="dashboard-link text-sm">
                  Create first shelf-life test
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {activityItems.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className="dashboard-row-item flex items-center gap-4"
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{
                      background:
                        "linear-gradient(180deg, #3B5BFF 0%, #2F54EB 100%)",
                    }}
                  >
                    {(item.actorName ?? "AI").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.actorName ?? "AI Assistant"} ·{" "}
                      <span className="font-normal text-slate-500">
                        {toSentenceCase(item.action)}{" "}
                        {toSentenceCase(item.entityType)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {relativeTime(item.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#3B5BFF]/20 bg-[#3B5BFF]/8 px-2.5 py-0.5 text-[10px] font-semibold text-[#3B5BFF]">
                    AI ASSISTANT
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bottom fade-out */}
        <div
          className="pointer-events-none mt-4 h-24"
          style={{
            background:
              "linear-gradient(180deg, rgba(59,91,255,0.04) 0%, transparent 100%)",
          }}
        />
      </main>
    );
  } catch (error) {
    return (
      <main className="dashboard-shell">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0f172a]">
              Welcome back, Levan
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Overview your R&D activity and formulation progress.
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
