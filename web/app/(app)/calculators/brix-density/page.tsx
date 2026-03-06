"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  brixFromDensity,
  densityFromBrix,
  type BrixDensityWarningCode,
} from "@/lib/physchem/brixDensity";

type Mode = "brix-to-density" | "density-to-brix";

const WARNING_COPY: Record<BrixDensityWarningCode, string> = {
  BRIX_OUT_OF_RANGE: "Brix must be in range 0-85.",
  DENSITY_OUT_OF_RANGE: "Density must be in range 0.98-1.45 kg/L.",
  TEMP_ASSUMED_20C:
    "Model is calibrated at 20 C. Temperature correction is not applied.",
  MAX_ITERATIONS_REACHED:
    "Numerical inversion hit iteration limit; result may be less precise.",
};

function toNumber(raw: string): number {
  return Number(raw.trim().replace(",", "."));
}

export default function BrixDensityCalculatorPage() {
  const [mode, setMode] = useState<Mode>("brix-to-density");
  const [brixInput, setBrixInput] = useState("12.0");
  const [densityInput, setDensityInput] = useState("1.048");
  const [tempCInput, setTempCInput] = useState("20");

  const tempC = toNumber(tempCInput);

  const result = useMemo(() => {
    if (!Number.isFinite(tempC)) {
      return {
        value: Number.NaN,
        warnings: [] as BrixDensityWarningCode[],
        error: "Please enter a valid temperature.",
      };
    }

    if (mode === "brix-to-density") {
      const brix = toNumber(brixInput);
      if (!Number.isFinite(brix)) {
        return {
          value: Number.NaN,
          warnings: [] as BrixDensityWarningCode[],
          error: "Please enter a valid Brix value.",
        };
      }

      const next = densityFromBrix(brix, tempC);
      const outOfRange = next.warnings.includes("BRIX_OUT_OF_RANGE");
      return {
        value: next.value,
        warnings: next.warnings,
        error: outOfRange ? WARNING_COPY.BRIX_OUT_OF_RANGE : null,
      };
    }

    const density = toNumber(densityInput);
    if (!Number.isFinite(density)) {
      return {
        value: Number.NaN,
        warnings: [] as BrixDensityWarningCode[],
        error: "Please enter a valid density value.",
      };
    }

    const next = brixFromDensity(density, tempC);
    const outOfRange = next.warnings.includes("DENSITY_OUT_OF_RANGE");
    return {
      value: next.value,
      warnings: next.warnings,
      error: outOfRange ? WARNING_COPY.DENSITY_OUT_OF_RANGE : null,
    };
  }, [mode, brixInput, densityInput, tempC]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brix / Density"
        description="Convert Brix to density and density to Brix for formulation and QC checks."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Mode</p>
              <div className="inline-flex rounded-md border border-gray-300 p-1">
                <button
                  type="button"
                  onClick={() => setMode("brix-to-density")}
                  className={`rounded px-3 py-1.5 text-sm ${
                    mode === "brix-to-density"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700"
                  }`}
                >
                  Brix to Density
                </button>
                <button
                  type="button"
                  onClick={() => setMode("density-to-brix")}
                  className={`rounded px-3 py-1.5 text-sm ${
                    mode === "density-to-brix"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700"
                  }`}
                >
                  Density to Brix
                </button>
              </div>
            </div>

            {mode === "brix-to-density" ? (
              <div className="space-y-2">
                <Label htmlFor="brix-input">Brix (%)</Label>
                <Input
                  id="brix-input"
                  type="number"
                  step="0.1"
                  value={brixInput}
                  onChange={(event) => setBrixInput(event.target.value)}
                  placeholder="e.g. 12.0"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="density-input">Density (kg/L)</Label>
                <Input
                  id="density-input"
                  type="number"
                  step="0.001"
                  value={densityInput}
                  onChange={(event) => setDensityInput(event.target.value)}
                  placeholder="e.g. 1.048"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="temp-input">Temperature (C)</Label>
              <Input
                id="temp-input"
                type="number"
                step="0.1"
                value={tempCInput}
                onChange={(event) => setTempCInput(event.target.value)}
                placeholder="e.g. 20"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "brix-to-density"
                ? "Estimated Density"
                : "Estimated Brix"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {result.error}
              </p>
            ) : (
              <p className="text-3xl font-semibold">
                {mode === "brix-to-density"
                  ? `${result.value.toFixed(3)} kg/L`
                  : `${result.value.toFixed(1)} Brix`}
              </p>
            )}

            {result.warnings.length === 0 ? (
              <Badge variant="secondary">20 C calibration</Badge>
            ) : (
              <div className="space-y-2">
                {result.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    {WARNING_COPY[warning]}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
