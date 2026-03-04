"use client";

import { useEffect, useMemo, useState } from "react";
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

  return (
    <main className="py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            CO₂ from Pressure
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Estimate dissolved CO₂ (g/L) from temperature and package pressure.
          </p>
        </div>
        <button
          type="button"
          title={LIMITATIONS_TEXT}
          className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          i
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Liquid Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={tempCInput}
              onChange={(event) => setTempCInput(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pressure (bar)
            </label>
            <input
              type="number"
              step="0.01"
              value={pressureInput}
              onChange={(event) => setPressureInput(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-gray-700">
            Pressure type
          </p>
          <div className="inline-flex rounded-md border border-gray-300 p-1">
            <button
              type="button"
              onClick={() => setPressureType("gauge")}
              className={`rounded px-3 py-1.5 text-sm ${
                pressureType === "gauge"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700"
              }`}
            >
              Gauge
            </button>
            <button
              type="button"
              onClick={() => setPressureType("absolute")}
              className={`rounded px-3 py-1.5 text-sm ${
                pressureType === "absolute"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700"
              }`}
            >
              Absolute
            </button>
          </div>
        </div>

        <details
          className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3"
          open={advancedOpen}
          onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer text-sm font-semibold text-gray-800">
            Advanced
          </summary>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-700">
                Headspace CO₂ fraction (yCO₂)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={yCO2Input}
                onChange={(event) => setYCO2Input(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-700">
                Liquid density (kg/L)
              </label>
              <input
                type="number"
                step="0.001"
                value={densityInput}
                onChange={(event) => setDensityInput(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                />
                Include water vapor correction
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Uses Antoine equation for water vapor pressure (in bar) and
                applies pCO₂ = (Pabs − pH₂O(T)) × yCO₂, clamped at 0.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                kH0 (mol/(kg·bar))
              </label>
              <input
                type="number"
                step="0.001"
                value={kH0Input}
                onChange={(event) => setKH0Input(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                A (K)
              </label>
              <input
                type="number"
                step="1"
                value={aInput}
                onChange={(event) => setAInput(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
                T0 (K)
              </label>
              <input
                type="number"
                step="0.01"
                value={t0Input}
                onChange={(event) => setT0Input(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </details>
      </section>

      <section className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Result</h2>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
          >
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy failed"
                : "Copy g/L"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : result ? (
          <>
            <p className="mt-3 text-2xl font-semibold text-blue-900">
              CO₂ = {formatNumber(result.co2_gL, 2)} g/L
            </p>
            <p className="mt-2 text-sm text-slate-700">{assumptionsLine}</p>

            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="mt-3 text-sm font-medium text-blue-700 underline"
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>

            {showDetails ? (
              <div className="mt-3 rounded-md border border-blue-200 bg-white p-3 text-sm text-gray-700">
                <p>kH(T): {result.debug.kH.toExponential(4)} mol/(kg·bar)</p>
                <p>Pabs: {formatNumber(result.debug.Pabs, 4)} bar</p>
                <p>pCO₂: {formatNumber(result.debug.pCO2, 4)} bar</p>
                <p>c (mol/kg): {formatNumber(result.debug.c_mol_per_kg, 6)}</p>
                <p>
                  Conversion: c × 44.0095 × {result.debug.densityKgL.toFixed(3)}
                  = {formatNumber(result.co2_gL, 4)} g/L
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {warnings.length > 0 ? (
          <div className="mt-3 space-y-2">
            {warnings.map((warning) => (
              <p
                key={warning}
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                {warning}
              </p>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
