"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FlaskConical,
  ArrowRightLeft,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const router = useRouter();
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
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-500/25">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-purple-700 uppercase">
              Converter
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Brix / Density
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Convert between Brix and density for formulation and QC checks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/calculators")}
          className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-purple-300 hover:text-purple-700 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Calculators
        </button>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card">
        {/* Mode selector bar */}
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Conversion Mode
            </span>
          </div>
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setMode("brix-to-density")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === "brix-to-density"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Brix → Density
            </button>
            <button
              type="button"
              onClick={() => setMode("density-to-brix")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                mode === "density-to-brix"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Density → Brix
            </button>
          </div>
        </div>

        <div className="p-6 pt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Inputs panel */}
            <div className="space-y-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Thermometer className="h-4 w-4 text-gray-400" />
                Input Parameters
              </h3>

              {mode === "brix-to-density" ? (
                <div className="space-y-2">
                  <Label
                    htmlFor="brix-input"
                    className="text-xs font-semibold tracking-wide text-gray-400 uppercase"
                  >
                    Brix (%)
                  </Label>
                  <Input
                    id="brix-input"
                    type="number"
                    step="0.1"
                    value={brixInput}
                    onChange={(event) => setBrixInput(event.target.value)}
                    placeholder="e.g. 12.0"
                    className="rounded-xl border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label
                    htmlFor="density-input"
                    className="text-xs font-semibold tracking-wide text-gray-400 uppercase"
                  >
                    Density (kg/L)
                  </Label>
                  <Input
                    id="density-input"
                    type="number"
                    step="0.001"
                    value={densityInput}
                    onChange={(event) => setDensityInput(event.target.value)}
                    placeholder="e.g. 1.048"
                    className="rounded-xl border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="temp-input"
                  className="text-xs font-semibold tracking-wide text-gray-400 uppercase"
                >
                  Temperature (°C)
                </Label>
                <Input
                  id="temp-input"
                  type="number"
                  step="0.1"
                  value={tempCInput}
                  onChange={(event) => setTempCInput(event.target.value)}
                  placeholder="e.g. 20"
                  className="rounded-xl border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            {/* Result panel */}
            <div className="space-y-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Droplets className="h-4 w-4 text-gray-400" />
                {mode === "brix-to-density"
                  ? "Estimated Density"
                  : "Estimated Brix"}
              </h3>

              <div className="cogs-kpi-card">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Droplets className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    {mode === "brix-to-density" ? "Density" : "Brix"}
                  </p>
                </div>
                {result.error ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {result.error}
                  </div>
                ) : (
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    {mode === "brix-to-density"
                      ? `${result.value.toFixed(3)} kg/L`
                      : `${result.value.toFixed(1)} °Brix`}
                  </p>
                )}
              </div>

              {/* Warnings / status */}
              {result.warnings.length === 0 ? (
                <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Badge
                    variant="secondary"
                    className="border-0 bg-transparent text-green-700"
                  >
                    20 °C calibration
                  </Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p className="text-sm text-amber-800">
                        {WARNING_COPY[warning]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
