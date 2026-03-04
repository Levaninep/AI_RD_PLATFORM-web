"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ApiErrorResponse, ShelfLifeTest } from "@/lib/shelf-life-types";

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function ShelfLifeReportPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [test, setTest] = useState<ShelfLifeTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shelf-life/${id}`, {
          cache: "no-store",
        });
        const data = await readJsonSafe<ShelfLifeTest | ApiErrorResponse>(
          response,
        );

        if (!response.ok) {
          throw new Error(
            (data as ApiErrorResponse | null)?.error?.message ||
              `Failed to load report data (HTTP ${response.status}).`,
          );
        }

        if (active) {
          setTest(data as ShelfLifeTest);
        }
      } catch (fetchError: unknown) {
        if (active) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load report.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const complianceSummary = useMemo(() => {
    if (!test) {
      return {
        pass: 0,
        fail: 0,
      };
    }

    let pass = 0;
    let fail = 0;

    for (const event of test.samplingEvents) {
      for (const parameter of event.testResult?.parameterResults ?? []) {
        if (parameter.passFail === "PASS") {
          pass += 1;
        } else if (parameter.passFail === "FAIL") {
          fail += 1;
        }
      }
    }

    return { pass, fail };
  }, [test]);

  if (loading) {
    return (
      <main className="py-6">
        <div className="rounded border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Loading report...
        </div>
      </main>
    );
  }

  if (!test) {
    return (
      <main className="py-6">
        <div className="rounded border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          {error ?? "Shelf-life report not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="py-6 print:bg-white">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/shelf-life/${id}`}
          className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to test
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Print report
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Shelf-Life Test Report
        </h1>
        <p className="mt-1 text-sm text-gray-600">Test No: {test.testNumber}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Product
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {test.productName}
            </p>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Packaging
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {test.packagingType}
            </p>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Planned shelf-life
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {Math.round(test.plannedShelfLifeDays / 30)} months
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Test window
            </p>
            <p className="mt-1 text-sm text-gray-800">
              {formatDate(test.startDate)} → {formatDate(test.endDatePlanned)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Status: {test.status.replace("_", " ")}
            </p>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Compliance summary
            </p>
            <p className="mt-1 text-sm text-gray-800">
              Pass: {complianceSummary.pass}
            </p>
            <p className="text-sm text-gray-800">
              Fail: {complianceSummary.fail}
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-base font-semibold text-gray-900">
          Conditions
        </h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
          {test.conditions.map((condition) => (
            <li key={condition.id}>
              {condition.type.replaceAll("_", " ")} ·{" "}
              {condition.temperatureC ?? "—"}°C · RH{" "}
              {condition.humidityPct ?? "—"}% · Light{" "}
              {condition.lightLux ?? "—"} lux
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-base font-semibold text-gray-900">
          Sampling events & outcomes
        </h2>
        <div className="mt-2 overflow-x-auto rounded border border-gray-200">
          <table className="w-full min-w-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Offset</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Summary</th>
              </tr>
            </thead>
            <tbody>
              {test.samplingEvents.map((event) => (
                <tr key={event.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{formatDate(event.plannedDate)}</td>
                  <td className="px-3 py-2">D+{event.dayOffset}</td>
                  <td className="px-3 py-2">{event.type}</td>
                  <td className="px-3 py-2">{event.status}</td>
                  <td className="px-3 py-2">
                    {event.testResult?.summaryStatus ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-6 text-base font-semibold text-gray-900">
          Conclusions
        </h2>
        <div className="mt-2 rounded border border-gray-200 p-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Final recommendation:</span>{" "}
            {test.finalRecommendation ?? "—"}
          </p>
          <p className="mt-1">
            <span className="font-semibold">NPD manager:</span>{" "}
            {test.approvedByNpd ?? "—"} ({formatDate(test.approvedByNpdDate)})
          </p>
          <p className="mt-1">
            <span className="font-semibold">Quality manager:</span>{" "}
            {test.approvedByQuality ?? "—"} (
            {formatDate(test.approvedByQualityDate)})
          </p>
        </div>
      </section>
    </main>
  );
}
