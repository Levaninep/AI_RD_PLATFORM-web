"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormulationOption = {
  id: string;
  name: string;
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

type CaloriesResponse = {
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

type ApiErrorResponse = {
  error?: { message?: string };
};

function isSuppressibleWarning(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  if (normalized.startsWith("batch density is missing.")) {
    return true;
  }

  if (
    normalized.startsWith("estimated nutrition for") &&
    (normalized.includes("from concentrate brix") ||
      normalized.includes("from sweetener profile") ||
      normalized.includes("from puree profile"))
  ) {
    return true;
  }

  return false;
}

function fmt(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
}

export default function CaloriesCalculatorPage() {
  const [options, setOptions] = useState<FormulationOption[]>([]);
  const [formulaId, setFormulaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CaloriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFormulas() {
      try {
        const response = await fetch("/api/formulations", {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | Array<{ id?: string; name?: string }>
          | { error?: { message?: string } }
          | null;

        if (!response.ok || !Array.isArray(body)) {
          if (!active) return;
          setError(
            (body as { error?: { message?: string } } | null)?.error?.message ??
              "Unable to load formulations.",
          );
          return;
        }

        const next = body
          .filter((item) => item.id && item.name)
          .map((item) => ({ id: String(item.id), name: String(item.name) }));

        if (!active) return;
        setOptions(next);
        if (next.length > 0) {
          setFormulaId((prev) => prev || next[0].id);
        }
      } catch {
        if (!active) return;
        setError("Unable to load formulations.");
      }
    }

    void loadFormulas();

    return () => {
      active = false;
    };
  }, []);

  async function runCalculation() {
    if (!formulaId) {
      setError("Select a formulation first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/calories?formulaId=${encodeURIComponent(formulaId)}`,
        {
          cache: "no-store",
        },
      );
      const body = (await response.json().catch(() => null)) as
        | CaloriesResponse
        | { error?: { message?: string } }
        | null;

      if (
        !response.ok ||
        !body ||
        "error" in body ||
        !("formulationId" in body)
      ) {
        setData(null);
        setError(
          body && "error" in body
            ? (body.error?.message ?? "Calculation failed.")
            : "Calculation failed.",
        );
        return;
      }

      setData(body as CaloriesResponse);
    } catch {
      setData(null);
      setError("Calculation failed.");
    } finally {
      setLoading(false);
    }
  }

  const visibleWarnings = useMemo(
    () =>
      (data?.warnings ?? []).filter(
        (warning) => !isSuppressibleWarning(warning),
      ),
    [data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calories Calculation"
        description="Calculate estimated nutrition per 100 ml for a saved formulation."
      />

      <Card>
        <CardHeader>
          <CardTitle>Formula Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={formulaId}
              onChange={(event) => setFormulaId(event.target.value)}
            >
              {options.length === 0 ? (
                <option value="">No formulations</option>
              ) : null}
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => void runCalculation()}
              disabled={loading || !formulaId}
            >
              {loading ? "Calculating..." : "Calculate"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void runCalculation()}
              disabled={loading || !formulaId}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Recalculate
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/saved-formulas"
              className="text-sm text-blue-700 hover:underline"
            >
              Back to formulas
            </Link>
          </div>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!data && !loading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Select a formula and run calculation to see nutrition cards and
            tables.
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Energy (kcal)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {fmt(data.per100ml.energyKcal, 1)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Carbohydrates (g)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {fmt(data.per100ml.carbohydrates, 1)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sugars (g)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {fmt(data.per100ml.sugars, 1)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Salt (g)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {fmt(data.per100ml.salt, 2)}
              </CardContent>
            </Card>
          </div>

          {visibleWarnings.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Warnings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {visibleWarnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    {warning}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Nutrition per 100 ml</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nutrient</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Energy</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.energyKcal, 1)} kcal /{" "}
                      {fmt(data.per100ml.energyKj, 0)} kJ
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fat</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.fat, 2)} g
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>of which saturates</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.saturates, 2)} g
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Carbohydrates</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.carbohydrates, 2)} g
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>of which sugars</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.sugars, 2)} g
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Protein</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.protein, 2)} g
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Salt</TableCell>
                    <TableCell className="text-right">
                      {fmt(data.per100ml.salt, 2)} g
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingredient Contribution (per 100 ml)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="text-right">Dosage (g)</TableHead>
                    <TableHead className="text-right">kcal</TableHead>
                    <TableHead className="text-right">Carbs (g)</TableHead>
                    <TableHead className="text-right">Sugars (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ingredientsBreakdown.map((row) => (
                    <TableRow key={row.ingredientId}>
                      <TableCell>{row.ingredientName}</TableCell>
                      <TableCell className="text-right">
                        {fmt(row.dosageGrams, 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(row.contributionPer100ml.energyKcal, 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(row.contributionPer100ml.carbohydrates, 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt(row.contributionPer100ml.sugars, 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
