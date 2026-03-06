"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const weight = toNumber(concentrateWeight);
    const cb = toNumber(concentrateBrix);
    const ssb =
      singleStrengthBrixValue != null &&
      Number.isFinite(singleStrengthBrixValue)
        ? singleStrengthBrixValue
        : null;

    if (
      weight == null ||
      cb == null ||
      ssb == null ||
      weight <= 0 ||
      cb <= 0 ||
      ssb <= 0
    ) {
      setFinalBatchWeight("");
      return;
    }

    const nextFinalBatchWeight = (weight * cb) / ssb;
    setFinalBatchWeight(nextFinalBatchWeight.toFixed(2));
  }, [concentrateWeight, concentrateBrix, singleStrengthBrixValue]);

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
    <div className="space-y-6">
      <PageHeader
        title="Juice Percentage Calculator"
        description="Compute juice equivalent and final juice percentage from concentrate brix data."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Juice / Puree Type</Label>
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label>Concentrate Weight (g)</Label>
              <Input
                value={concentrateWeight}
                onChange={(e) => setConcentrateWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Concentrate Brix
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Brix value of the concentrate ingredient.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                value={concentrateBrix}
                onChange={(e) => setConcentrateBrix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Single Strength Brix</Label>
              <Input
                value={
                  singleStrengthBrixValue != null
                    ? String(singleStrengthBrixValue)
                    : ""
                }
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Static by selected juice/puree type.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Final Batch Weight (g)</Label>
              <Input value={finalBatchWeight} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from Concentrate Weight, Concentrate Brix, and
                Single Strength Brix.
              </p>
            </div>
            <Button variant="outline" className="w-full">
              Save Scenario
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Juice Equivalent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {result.juiceEquivalent.toFixed(2)} g
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Juice %</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {result.juicePercent.toFixed(1)}%
              </p>
              {!result.valid ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter valid numeric values to calculate.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Multi-juice contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={addRow}>
              Add juice / puree
            </Button>
          </div>
          <div className="max-h-85 overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/70">
                <TableRow>
                  <TableHead>Juice / Puree</TableHead>
                  <TableHead>Weight (g)</TableHead>
                  <TableHead>Conc. Brix</TableHead>
                  <TableHead>SS Brix</TableHead>
                  <TableHead className="text-right">Equivalent (g)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowSummaries.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell>
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
                        className="w-55 rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="">Select</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.weight}
                        onChange={(event) =>
                          updateRow(row.id, { weight: event.target.value })
                        }
                        className="h-8 w-30"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.concentrateBrix}
                        onChange={(event) =>
                          updateRow(row.id, {
                            concentrateBrix: event.target.value,
                          })
                        }
                        className="h-8 w-30"
                      />
                    </TableCell>
                    <TableCell>
                      {row.ssb != null ? row.ssb.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.equivalent != null ? row.equivalent.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right">
                    {totalEquivalent.toFixed(2)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Total Juice % from selected juice/puree rows:{" "}
            <span className="font-semibold text-foreground">
              {blendedJuicePercent != null
                ? `${blendedJuicePercent.toFixed(1)}%`
                : "—"}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
