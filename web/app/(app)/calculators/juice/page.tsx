"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Citrus,
  Info,
  Percent,
  Weight,
  FlaskConical,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Ingredient } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { brixToDensityGPerML } from "@/lib/brix";

function toNumber(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

type JuiceOption = {
  id: string;
  name: string;
  singleStrengthBrix: number | null;
  defaultConcentrateBrix: number | null;
};

type JuiceContributionRow = {
  id: string;
  ingredientId: string;
  weight: string;
  concentrateBrix: string;
};

function createRow(optionId = "", defaultBrix = "65"): JuiceContributionRow {
  return {
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ingredientId: optionId,
    weight: "",
    concentrateBrix: defaultBrix,
  };
}

export default function JuiceCalculatorPage() {
  const router = useRouter();
  const [options, setOptions] = useState<JuiceOption[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [concentrateWeight, setConcentrateWeight] = useState("125");
  const [concentrateBrix, setConcentrateBrix] = useState("65");
  const [finalBatchWeight, setFinalBatchWeight] = useState("1000");
  const [rows, setRows] = useState<JuiceContributionRow[]>([createRow()]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const items: Ingredient[] = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = await fetch(
            `/api/ingredients?includeEffective=true&limit=100&page=${page}`,
            {
              cache: "no-store",
            },
          );

          const body = (await response.json().catch(() => null)) as
            | { items?: Ingredient[]; totalPages?: number }
            | Ingredient[]
            | null;

          if (!response.ok || !body) {
            break;
          }

          const pageItems = Array.isArray(body) ? body : (body.items ?? []);
          items.push(...pageItems);

          if (!Array.isArray(body) && body.totalPages) {
            totalPages = body.totalPages;
          }

          page += 1;
        }

        const juiceAndPuree = items
          .filter((item) => {
            const name = (item.ingredientName ?? item.name ?? "")
              .trim()
              .toLowerCase();
            const category = (item.category ?? "").toLowerCase();
            const singleStrengthBrix =
              toNumericValue(item.effectiveSingleStrengthBrix) ??
              toNumericValue(item.singleStrengthBrix);

            const isJuice = category === "juice";
            const isPuree = name.includes("puree") || name.includes("purée");

            return (
              (isJuice || isPuree) &&
              singleStrengthBrix != null &&
              Number.isFinite(singleStrengthBrix) &&
              singleStrengthBrix > 0
            );
          })
          .map((item) => ({
            id: item.id,
            name: item.ingredientName ?? item.name ?? "Unknown",
            singleStrengthBrix:
              toNumericValue(item.effectiveSingleStrengthBrix) ??
              toNumericValue(item.singleStrengthBrix),
            defaultConcentrateBrix:
              toNumericValue(item.effectiveBrixPercent) ??
              toNumericValue(item.brixPercent),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!active) {
          return;
        }

        setOptions(juiceAndPuree);

        if (juiceAndPuree.length > 0) {
          const first = juiceAndPuree[0];

          setSelectedIngredientId((prev) => prev || juiceAndPuree[0].id);
          setConcentrateBrix((prev) => {
            if (prev.trim().length > 0) {
              return prev;
            }

            return first.defaultConcentrateBrix != null
              ? String(first.defaultConcentrateBrix)
              : "65";
          });

          setRows((prev) => {
            if (prev.length === 0) {
              return [
                createRow(
                  first.id,
                  first.defaultConcentrateBrix != null
                    ? String(first.defaultConcentrateBrix)
                    : "65",
                ),
              ];
            }

            return prev.map((row, index) => {
              if (index !== 0 || row.ingredientId) {
                return row;
              }

              return {
                ...row,
                ingredientId: juiceAndPuree[0].id,
                concentrateBrix:
                  juiceAndPuree[0].defaultConcentrateBrix != null
                    ? String(juiceAndPuree[0].defaultConcentrateBrix)
                    : row.concentrateBrix,
              };
            });
          });
        }
      } catch {
        // keep UI usable even if ingredients fail to load
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const selectedOption = useMemo(
    () => options.find((item) => item.id === selectedIngredientId) ?? null,
    [options, selectedIngredientId],
  );

  const singleStrengthBrixValue = selectedOption?.singleStrengthBrix ?? null;

  useEffect(() => {
    const ssb =
      singleStrengthBrixValue != null &&
      Number.isFinite(singleStrengthBrixValue)
        ? singleStrengthBrixValue
        : null;

    if (ssb == null || ssb <= 0) {
      setFinalBatchWeight("");
      return;
    }

    // 1 L basis: final batch grams = density(g/mL) at SS Brix × 1000 mL
    const densityGPerML = brixToDensityGPerML(ssb);
    const nextFinalBatchWeight = densityGPerML * 1000;
    setFinalBatchWeight(nextFinalBatchWeight.toFixed(2));
  }, [singleStrengthBrixValue]);

  const result = useMemo(() => {
    const weight = toNumber(concentrateWeight);
    const cb = toNumber(concentrateBrix);
    const ssb =
      singleStrengthBrixValue != null &&
      Number.isFinite(singleStrengthBrixValue)
        ? singleStrengthBrixValue
        : null;
    const finalW = toNumber(finalBatchWeight);

    if (!weight || !cb || !ssb || !finalW || ssb <= 0 || finalW <= 0) {
      return { juiceEquivalent: 0, juicePercent: 0, valid: false };
    }

    const juiceEquivalent = (weight * cb) / ssb;
    const juicePercent = (juiceEquivalent / finalW) * 100;

    return {
      juiceEquivalent: Number(juiceEquivalent.toFixed(2)),
      juicePercent: Number(juicePercent.toFixed(1)),
      valid: true,
    };
  }, [
    concentrateWeight,
    concentrateBrix,
    singleStrengthBrixValue,
    finalBatchWeight,
  ]);

  const rowSummaries = rows.map((row) => {
    const option = options.find((item) => item.id === row.ingredientId) ?? null;
    const weight = toNumber(row.weight);
    const brix = toNumber(row.concentrateBrix);
    const ssb = option?.singleStrengthBrix ?? null;
    const equivalent =
      weight != null &&
      brix != null &&
      ssb != null &&
      Number.isFinite(ssb) &&
      ssb > 0 &&
      weight > 0 &&
      brix > 0
        ? (weight * brix) / ssb
        : null;

    return {
      ...row,
      name: option?.name ?? "Select juice/puree",
      ssb,
      equivalent,
    };
  });

  const totalEquivalent = rowSummaries.reduce(
    (sum, row) => (row.equivalent != null ? sum + row.equivalent : sum),
    0,
  );

  const finalWeightForBlend = toNumber(finalBatchWeight);
  const blendedJuicePercent =
    finalWeightForBlend != null && finalWeightForBlend > 0
      ? (totalEquivalent / finalWeightForBlend) * 100
      : null;

  function addRow() {
    const first = options[0];
    setRows((prev) => [
      ...prev,
      createRow(
        first?.id ?? "",
        first?.defaultConcentrateBrix != null
          ? String(first.defaultConcentrateBrix)
          : "65",
      ),
    ]);
  }

  function removeRow(rowId: string) {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.id !== rowId),
    );
  }

  function updateRow(
    rowId: string,
    patch: Partial<
      Pick<JuiceContributionRow, "ingredientId" | "weight" | "concentrateBrix">
    >,
  ) {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  }

  return (
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-green-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25">
              <Citrus className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-green-700 uppercase">
              Juice Engine
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Juice % Calculator
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Compute juice equivalent and final juice percentage from concentrate
            brix data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/calculators")}
          className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-green-300 hover:text-green-700 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Calculators
        </button>
      </div>

      {/* Single juice analysis card */}
      <div className="cogs-workspace-card mb-6">
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Single Juice Analysis
            </span>
          </div>
        </div>

        <div className="p-6 pt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Juice / Puree Type
                </Label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedIngredientId(nextId);
                    const option = options.find((item) => item.id === nextId);
                    if (option?.defaultConcentrateBrix != null) {
                      setConcentrateBrix(String(option.defaultConcentrateBrix));
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:outline-none"
                >
                  {options.length === 0 ? (
                    <option value="">No juice/puree with SS Brix found</option>
                  ) : null}
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Concentrate Weight (g)
                </Label>
                <Input
                  value={concentrateWeight}
                  onChange={(e) => setConcentrateWeight(e.target.value)}
                  className="rounded-xl border-gray-200 bg-white px-4 py-2.5 shadow-sm transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Concentrate Brix
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-gray-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Brix value of the concentrate ingredient.
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  value={concentrateBrix}
                  onChange={(e) => setConcentrateBrix(e.target.value)}
                  className="rounded-xl border-gray-200 bg-white px-4 py-2.5 shadow-sm transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Single Strength Brix
                </Label>
                <Input
                  value={
                    singleStrengthBrixValue != null
                      ? String(singleStrengthBrixValue)
                      : ""
                  }
                  readOnly
                  disabled
                  className="rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5"
                />
                <p className="text-xs text-gray-400">
                  Static by selected juice/puree type.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Final Batch Weight (g)
                </Label>
                <Input
                  value={finalBatchWeight}
                  readOnly
                  disabled
                  className="rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5"
                />
                <p className="text-xs text-gray-400">
                  Auto-calculated: Density at SS Brix × 1000 (1 L basis).
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="grid gap-4 content-start">
              <article className="cogs-kpi-card">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    <Weight className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Juice Equivalent
                  </p>
                </div>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                  {result.juiceEquivalent.toFixed(2)}
                  <span className="ml-1 text-base font-medium text-gray-400">
                    g
                  </span>
                </p>
              </article>

              <article className="cogs-kpi-card">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Percent className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Juice %
                  </p>
                </div>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                  {result.juicePercent.toFixed(1)}
                  <span className="ml-1 text-base font-medium text-gray-400">
                    %
                  </span>
                </p>
                {!result.valid ? (
                  <p className="mt-2 text-xs text-gray-400">
                    Enter valid numeric values to calculate.
                  </p>
                ) : null}
              </article>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-juice contribution card */}
      <div className="cogs-workspace-card">
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <Citrus className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Multi-Juice Contribution
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="rounded-xl"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Juice
          </Button>
        </div>

        <div className="p-6 pt-0">
          <div className="cogs-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100">
                  <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Juice / Puree
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Weight (g)
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Conc. Brix
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    SS Brix
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Equivalent (g)
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-50">
                {rowSummaries.map((row) => (
                  <TableRow
                    key={row.id}
                    className="transition-colors hover:bg-green-50/40"
                  >
                    <TableCell className="px-4 py-3">
                      <select
                        value={row.ingredientId}
                        onChange={(event) => {
                          const option =
                            options.find(
                              (item) => item.id === event.target.value,
                            ) ?? null;
                          updateRow(row.id, {
                            ingredientId: event.target.value,
                            concentrateBrix:
                              option?.defaultConcentrateBrix != null
                                ? String(option.defaultConcentrateBrix)
                                : row.concentrateBrix,
                          });
                        }}
                        className="w-55 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm"
                      >
                        <option value="">Select</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        value={row.weight}
                        onChange={(event) =>
                          updateRow(row.id, { weight: event.target.value })
                        }
                        className="h-8 w-28 rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        value={row.concentrateBrix}
                        onChange={(event) =>
                          updateRow(row.id, {
                            concentrateBrix: event.target.value,
                          })
                        }
                        className="h-8 w-28 rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-gray-600">
                      {row.ssb != null ? row.ssb.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                      {row.equivalent != null ? row.equivalent.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-gray-200">
                  <TableCell
                    colSpan={4}
                    className="px-4 py-3 text-sm font-bold text-gray-900"
                  >
                    Total
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-green-800">
                    {totalEquivalent.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-100 bg-linear-to-r from-green-50/80 to-emerald-50/60 px-5 py-3">
            <Percent className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase">
                Total Juice %
              </p>
              <p className="text-sm text-gray-700">
                <span className="text-lg font-bold text-green-700">
                  {blendedJuicePercent != null
                    ? `${blendedJuicePercent.toFixed(1)}%`
                    : "—"}
                </span>
                <span className="ml-2 text-gray-400">
                  from selected juice/puree rows
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
