"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Clock3, Flame, Salad, Waves } from "lucide-react";
import FormulaSnapshotCard, {
  type DashboardFormulaSnapshot,
} from "@/components/dashboard/FormulaSnapshotCard";
import { resolveBasePricePerKg } from "@/lib/formulation";

type IngredientCostLine = {
  id: string;
  name: string;
  share: number;
};

type DashboardActivityItem = {
  id: string;
  actorName: string | null;
  actionLabel: string;
  entityTypeLabel: string;
  relativeTimeLabel: string;
};

type NutritionValues = {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturates: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
};

type NutritionResult = {
  formulationId: string;
  formulationName: string;
  batchMassGrams: number;
  batchVolumeMl: number;
  totalsPerBatch: NutritionValues;
  per100ml: NutritionValues;
  ingredientsBreakdown: Array<{
    ingredientId: string;
    ingredientName: string;
    dosageGrams: number;
    contributionPer100ml: NutritionValues;
  }>;
  warnings: string[];
};

function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatNutritionValue(value: number, unit: string, digits = 2): string {
  return `${formatNumber(value, digits)} ${unit}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }

  if (value >= 10) {
    return `${Math.round(value)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function buildIngredientCostBreakdown(
  formulation: DashboardFormulaSnapshot | null,
): IngredientCostLine[] {
  if (!formulation) {
    return [];
  }

  const lines = formulation.ingredients
    .map((line) => {
      const basePricePerKg = resolveBasePricePerKg({
        name: line.ingredient.name,
        ingredientName: line.ingredient.name,
        pricePerKgEur: line.ingredient.pricePerKgEur,
        pricePerKg: line.ingredient.pricePerKg,
      });
      const pricePerKg =
        line.priceOverridePerKg != null && line.priceOverridePerKg > 0
          ? line.priceOverridePerKg
          : basePricePerKg;
      const lineCost =
        pricePerKg != null && Number.isFinite(pricePerKg) && pricePerKg > 0
          ? (line.dosageGrams / 1000) * pricePerKg
          : 0;

      return {
        id: line.id,
        name: line.ingredient.name,
        lineCost,
      };
    })
    .sort((left, right) => right.lineCost - left.lineCost);

  const totalCost = lines.reduce((sum, line) => sum + line.lineCost, 0);

  return lines.slice(0, 4).map((line) => ({
    id: line.id,
    name: line.name,
    share: totalCost > 0 ? (line.lineCost / totalCost) * 100 : 0,
  }));
}

export default function DashboardFormulaSection({
  formulations,
  activityItems,
}: {
  formulations: DashboardFormulaSnapshot[];
  activityItems: DashboardActivityItem[];
}) {
  const [selectedFormulationId, setSelectedFormulationId] = useState<
    string | null
  >(formulations[0]?.id ?? null);
  const [nutrition, setNutrition] = useState<NutritionResult | null>(null);
  const [nutritionState, setNutritionState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (!formulations.length) {
      setSelectedFormulationId(null);
      return;
    }

    setSelectedFormulationId((current) => {
      if (
        current &&
        formulations.some((formulation) => formulation.id === current)
      ) {
        return current;
      }

      return formulations[0].id;
    });
  }, [formulations]);

  const selectedFormulation = useMemo(
    () =>
      formulations.find(
        (formulation) => formulation.id === selectedFormulationId,
      ) ??
      formulations[0] ??
      null,
    [formulations, selectedFormulationId],
  );

  const ingredientCostBreakdown = useMemo(
    () => buildIngredientCostBreakdown(selectedFormulation),
    [selectedFormulation],
  );

  useEffect(() => {
    if (!selectedFormulation?.id) {
      setNutrition(null);
      setNutritionState("idle");
      return;
    }

    const controller = new AbortController();

    async function loadNutrition() {
      setNutritionState("loading");

      try {
        const response = await fetch(
          `/api/calories?formulaId=${encodeURIComponent(selectedFormulation.id)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | NutritionResult
          | { error?: { message?: string } }
          | null;

        if (!response.ok || !payload || !("per100ml" in payload)) {
          throw new Error(
            (payload && "error" in payload && payload.error?.message) ||
              "Unable to load nutrition data.",
          );
        }

        setNutrition(payload);
        setNutritionState("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setNutrition(null);
        setNutritionState("error");
      }
    }

    void loadNutrition();

    return () => controller.abort();
  }, [selectedFormulation?.id]);

  const nutritionDrivers = useMemo(() => {
    if (!nutrition) {
      return [];
    }

    return nutrition.ingredientsBreakdown
      .filter((item) => item.contributionPer100ml.energyKcal > 0)
      .slice(0, 3);
  }, [nutrition]);

  const fallbackCostBreakdown = [
    { id: "a", name: "Juice", share: 34 },
    { id: "b", name: "Sugar", share: 27 },
    { id: "c", name: "Citrus Acid", share: 20 },
    { id: "d", name: "Natural Flavor", share: 13 },
  ];

  return (
    <>
      <div className="space-y-3">
        <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">
              Ingredient Cost
            </h3>
            <BadgeDollarSign className="size-4 text-slate-300" />
          </div>
          <div className="space-y-2">
            {(ingredientCostBreakdown.length
              ? ingredientCostBreakdown
              : fallbackCostBreakdown
            ).map((item) => (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                  <span>{item.name}</span>
                  <span>{formatPercent(item.share)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-blue-400"
                    style={{
                      width: `${Math.max(8, Math.min(item.share, 100))}%`,
                    }}
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

      <FormulaSnapshotCard
        formulation={selectedFormulation}
        formulations={formulations}
        selectedFormulationId={selectedFormulationId}
        onFormulationChange={setSelectedFormulationId}
      />

      <div className="space-y-3">
        <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Nutritional Data
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Per 100 ml of selected formula
              </p>
            </div>
            <Flame className="size-4 text-slate-300" />
          </div>

          {nutritionState === "loading" ? (
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-white/5" />
              <div className="h-10 rounded-lg bg-white/5" />
              <div className="h-10 rounded-lg bg-white/5" />
            </div>
          ) : nutritionState === "ready" && nutrition ? (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                      Energy
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-white">
                      {formatNumber(nutrition.per100ml.energyKcal, 1)}
                      <span className="ml-1 text-base font-medium text-slate-300">
                        kcal
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <p>
                      {formatNutritionValue(
                        nutrition.per100ml.energyKj,
                        "kJ",
                        1,
                      )}
                    </p>
                    <p className="mt-1">
                      {formatNutritionValue(nutrition.batchVolumeMl, "ml", 0)}{" "}
                      batch
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-slate-400">Carbs</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatNutritionValue(
                        nutrition.per100ml.carbohydrates,
                        "g",
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-slate-400">Sugars</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatNutritionValue(nutrition.per100ml.sugars, "g")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-slate-400">Protein</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatNutritionValue(nutrition.per100ml.protein, "g")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-slate-400">Salt</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatNutritionValue(nutrition.per100ml.salt, "g")}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">
              Nutrition data is not available for the selected formula yet.
            </div>
          )}
        </article>

        <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Nutrition Drivers
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Main contributors per 100 ml
              </p>
            </div>
            <Salad className="size-4 text-slate-300" />
          </div>

          {nutritionState === "ready" && nutritionDrivers.length > 0 ? (
            <div className="space-y-2">
              {nutritionDrivers.map((item) => (
                <div
                  key={item.ingredientId}
                  className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{item.ingredientName}</span>
                    <span className="font-semibold text-white">
                      {formatNutritionValue(
                        item.contributionPer100ml.energyKcal,
                        "kcal",
                        1,
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3 text-slate-400">
                    <span>
                      {formatNutritionValue(item.dosageGrams, "g", 0)} in batch
                    </span>
                    <span>
                      {formatNutritionValue(
                        item.contributionPer100ml.sugars,
                        "g sugar",
                      )}
                    </span>
                  </div>
                </div>
              ))}

              {nutrition && nutrition.warnings.length > 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-slate-300">
                  <div className="mb-1 flex items-center gap-2 font-medium text-slate-200">
                    <Waves className="size-3.5" />
                    Nutrition notes
                  </div>
                  <p>{nutrition.warnings[0]}</p>
                </div>
              ) : null}
            </div>
          ) : nutritionState === "loading" ? (
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-white/5" />
              <div className="h-12 rounded-lg bg-white/5" />
              <div className="h-12 rounded-lg bg-white/5" />
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">
              Ingredient-level nutrition contributions will appear here once the
              formula nutrition is available.
            </div>
          )}
        </article>

        <article className="rounded-xl border border-white/10 bg-[#132749] p-3">
          <h3 className="text-sm font-semibold text-slate-100">
            Recent Activity
          </h3>
          <ul className="mt-2 space-y-1.5">
            {activityItems.map((item) => (
              <li key={item.id} className="rounded-md bg-white/5 px-2 py-1.5">
                <p className="text-xs font-medium text-slate-100">
                  {item.actionLabel} · {item.entityTypeLabel}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  {item.actorName ?? "System"} · {item.relativeTimeLabel}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}
