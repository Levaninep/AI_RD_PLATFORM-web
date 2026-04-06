"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gauge,
  Wind,
  Thermometer,
  Copy,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  Info,
  Droplets,
} from "lucide-react";
import {
  CO2CalculationError,
  type CalculateCO2Result,
  type PressureType,
  calculateCO2_gL,
} from "@/lib/co2";
import { CO2_HENRY_DEFAULTS, CO2_INPUT_LIMITS } from "@/lib/constants/co2";

const LIMITATIONS_TEXT =
  "Ideal Henry's law estimate for CO₂ in water. Real beverages (sugar, acids, salts, alcohol) can shift solubility. Use for practical estimation and verify with lab measurements.";

function toOptionalNumber(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatNumber(value: number, digits = 3): string {
  return value.toFixed(digits);
}

export default function Co2CalculationsPage() {
  const [tempCInput, setTempCInput] = useState("20");
  const [pressureInput, setPressureInput] = useState("2.5");
  const [pressureType, setPressureType] = useState<PressureType>("gauge");

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [yCO2Input, setYCO2Input] = useState("1.0");
  const [includeWaterVapor, setIncludeWaterVapor] = useState(false);
  const [densityInput, setDensityInput] = useState("1.000");

  const [kH0Input, setKH0Input] = useState(
    String(CO2_HENRY_DEFAULTS.kH0_mol_per_kg_bar),
  );
  const [aInput, setAInput] = useState(String(CO2_HENRY_DEFAULTS.A_K));
  const [t0Input, setT0Input] = useState(String(CO2_HENRY_DEFAULTS.T0_K));

  const [result, setResult] = useState<CalculateCO2Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const tempC = toOptionalNumber(tempCInput);
  const pressureBar = toOptionalNumber(pressureInput);
  const yCO2 = toOptionalNumber(yCO2Input);
  const densityKgL = toOptionalNumber(densityInput);
  const kH0 = toOptionalNumber(kH0Input);
  const A = toOptionalNumber(aInput);
  const T0 = toOptionalNumber(t0Input);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (tempC == null || pressureBar == null) {
        setResult(null);
        setError("Please enter temperature and pressure to calculate CO₂.");
        return;
      }

      if (!Number.isFinite(tempC) || !Number.isFinite(pressureBar)) {
        setResult(null);
        setError("Please use valid numbers for temperature and pressure.");
        return;
      }

      try {
        const next = calculateCO2_gL({
          tempC,
          pressureBar,
          pressureType,
          yCO2:
            yCO2 != null && Number.isFinite(yCO2)
              ? yCO2
              : CO2_INPUT_LIMITS.yCO2.max,
          includeWaterVapor,
          densityKgL:
            densityKgL != null && Number.isFinite(densityKgL)
              ? densityKgL
              : CO2_INPUT_LIMITS.densityKgL.default,
          henry: {
            kH0: kH0 != null && Number.isFinite(kH0) ? kH0 : undefined,
            A: A != null && Number.isFinite(A) ? A : undefined,
            T0: T0 != null && Number.isFinite(T0) ? T0 : undefined,
          },
        });

        setResult(next);
        setError(null);
      } catch (calcError: unknown) {
        setResult(null);
        if (calcError instanceof CO2CalculationError) {
          setError(calcError.message);
          return;
        }

        setError("Unable to compute CO₂ right now. Please check your inputs.");
      }
    }, 220);

    return () => window.clearTimeout(handle);
  }, [
    tempC,
    pressureBar,
    pressureType,
    yCO2,
    includeWaterVapor,
    densityKgL,
    kH0,
    A,
    T0,
  ]);

  const absolutePressure = useMemo(() => {
    if (
      pressureBar == null ||
      !Number.isFinite(pressureBar) ||
      (pressureType === "gauge" && pressureBar < 0)
    ) {
      return null;
    }

    return pressureType === "gauge" ? pressureBar + 1.01325 : pressureBar;
  }, [pressureBar, pressureType]);

  const assumptionsLine = useMemo(() => {
    const y = yCO2 != null && Number.isFinite(yCO2) ? yCO2 : 1;
    const density =
      densityKgL != null && Number.isFinite(densityKgL) ? densityKgL : 1;

    return `Assumed headspace: ${(y * 100).toFixed(1)}% CO₂; Density: ${density.toFixed(3)} kg/L; Water vapor correction: ${includeWaterVapor ? "on" : "off"}`;
  }, [yCO2, densityKgL, includeWaterVapor]);

  const warnings = useMemo(() => {
    const nextWarnings: string[] = [];

    if (
      tempC != null &&
      Number.isFinite(tempC) &&
      (tempC < CO2_INPUT_LIMITS.tempC.recommendedMin ||
        tempC > CO2_INPUT_LIMITS.tempC.recommendedMax)
    ) {
      nextWarnings.push(
        "Temperature is outside the typical 0–40 °C soft-drink range.",
      );
    }

    if (
      absolutePressure != null &&
      absolutePressure > CO2_INPUT_LIMITS.pressureAbsBar.recommendedMax
    ) {
      nextWarnings.push(
        "Pressure is above typical packaging range. Verify pressure type and instrument reading.",
      );
    }

    if (result && result.co2_gL > 12) {
      nextWarnings.push(
        "Unusually high — check pressure type, temperature, and assumptions.",
      );
    }

    return nextWarnings;
  }, [tempC, absolutePressure, result]);

  async function handleCopy() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.co2_gL.toFixed(2));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1200);
    }
  }

  const router = useRouter();

  return (
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-600 to-sky-700 text-white shadow-lg shadow-cyan-500/25">
              <Wind className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-cyan-700 uppercase">
              Carbonation
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            CO₂ from Pressure
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Estimate dissolved CO₂ (g/L) from temperature and package pressure.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            title={LIMITATIONS_TEXT}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-700 hover:shadow-md"
          >
            <Info className="h-4 w-4" />
            Limitations
          </button>
          <button
            type="button"
            onClick={() => router.push("/calculators")}
            className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-cyan-300 hover:text-cyan-700 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Calculators
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Inputs card */}
        <div className="cogs-workspace-card">
          <div className="cogs-selector-bar">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-cyan-600" />
              <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Input Parameters
              </span>
            </div>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setPressureType("gauge")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  pressureType === "gauge"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Gauge className="mr-1.5 inline h-3.5 w-3.5" />
                Gauge
              </button>
              <button
                type="button"
                onClick={() => setPressureType("absolute")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  pressureType === "absolute"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Absolute
              </button>
            </div>
          </div>

          <div className="space-y-5 p-6 pt-0">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Liquid Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempCInput}
                  onChange={(event) => setTempCInput(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Pressure (bar)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pressureInput}
                  onChange={(event) => setPressureInput(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Advanced section */}
            <details
              className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4"
              open={advancedOpen}
              onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
            >
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition ${advancedOpen ? "rotate-180" : ""}`}
                />
                Advanced Parameters
              </summary>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Headspace CO₂ fraction (yCO₂)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={yCO2Input}
                    onChange={(event) => setYCO2Input(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Liquid density (kg/L)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={densityInput}
                    onChange={(event) => setDensityInput(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={includeWaterVapor}
                      onChange={(event) =>
                        setIncludeWaterVapor(event.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    Include water vapor correction
                  </label>
                  <p className="mt-1 text-xs text-gray-400">
                    Uses Antoine equation for water vapor pressure (in bar) and
                    applies pCO₂ = (Pabs − pH₂O(T)) × yCO₂, clamped at 0.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    kH0 (mol/(kg·bar))
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={kH0Input}
                    onChange={(event) => setKH0Input(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    A (K)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={aInput}
                    onChange={(event) => setAInput(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                    T0 (K)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={t0Input}
                    onChange={(event) => setT0Input(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Result card */}
        <div className="space-y-4">
          <div className="cogs-kpi-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-cyan-100 to-sky-100 text-cyan-600">
                  <Droplets className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Result
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-40"
              >
                {copyState === "copied" ? (
                  <>
                    <Check className="h-3 w-3 text-green-600" /> Copied
                  </>
                ) : copyState === "failed" ? (
                  <>
                    <X className="h-3 w-3 text-red-500" /> Failed
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy g/L
                  </>
                )}
              </button>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : result ? (
              <>
                <p className="text-4xl font-bold tracking-tight text-gray-900">
                  {formatNumber(result.co2_gL, 2)}
                  <span className="ml-1.5 text-base font-medium text-gray-400">
                    g/L
                  </span>
                </p>
                <p className="mt-3 text-xs leading-relaxed text-gray-400">
                  {assumptionsLine}
                </p>

                <button
                  type="button"
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="mt-4 text-xs font-semibold text-cyan-600 transition hover:text-cyan-800"
                >
                  {showDetails ? "Hide details" : "Show details"}
                </button>

                {showDetails ? (
                  <div className="mt-3 space-y-1 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-600">
                    <p>
                      kH(T): {result.debug.kH.toExponential(4)} mol/(kg·bar)
                    </p>
                    <p>Pabs: {formatNumber(result.debug.Pabs, 4)} bar</p>
                    <p>pCO₂: {formatNumber(result.debug.pCO2, 4)} bar</p>
                    <p>
                      c (mol/kg): {formatNumber(result.debug.c_mol_per_kg, 6)}
                    </p>
                    <p>
                      Conversion: c × 44.0095 ×{" "}
                      {result.debug.densityKgL.toFixed(3)}={" "}
                      {formatNumber(result.co2_gL, 4)} g/L
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {/* Warnings */}
          {warnings.length > 0 ? (
            <div className="space-y-2">
              {warnings.map((warning) => (
                <div
                  key={warning}
                  className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
