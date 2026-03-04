"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  MICRO_TEMPLATE,
  PHYS_CHEM_TEMPLATE,
  co2EndOfLifePass,
  computeRequiredDecarbDuration,
  computeSpecificDecarbTime,
  generateSampleLabel,
  migrationTemplateByPackaging,
} from "@/lib/shelf-life";
import type {
  ApiErrorResponse,
  ShelfLifeTest,
  ParameterResult,
  OrganolepticPanelistResult,
  ShelfLifeActivityLog,
} from "@/lib/shelf-life-types";
import { ActivityFeed } from "@/components/shelf-life/activity/ActivityFeed";

type ResultDraft = {
  summaryStatus: string;
  deviationNotes: string;
  parameters: Array<{
    group: "MICRO" | "PHYS_CHEM" | "CO2" | "MIGRATION" | "VISUAL" | "COATING";
    parameterKey: string;
    unit: string;
    normativeText: string;
    valueText: string;
    valueNumber: string;
    passFail: "PASS" | "FAIL" | "NOT_SET";
    comment: string;
  }>;
  panelists: Array<{
    panelistCode: string;
    tasteScore: string;
    smellScore: string;
    colorScore: string;
    homogeneityScore: string;
    appearanceScore: string;
    overallScore: string;
    comments: string;
  }>;
};

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function parameterToDraft(
  parameter: ParameterResult,
): ResultDraft["parameters"][number] {
  return {
    group: parameter.group,
    parameterKey: parameter.parameterKey,
    unit: parameter.unit ?? "",
    normativeText: parameter.normativeText ?? "",
    valueText: parameter.valueText ?? "",
    valueNumber:
      parameter.valueNumber == null ? "" : String(parameter.valueNumber),
    passFail: parameter.passFail,
    comment: parameter.comment ?? "",
  };
}

function panelistToDraft(
  panelist: OrganolepticPanelistResult,
): ResultDraft["panelists"][number] {
  return {
    panelistCode: panelist.panelistCode,
    tasteScore: panelist.tasteScore == null ? "" : String(panelist.tasteScore),
    smellScore: panelist.smellScore == null ? "" : String(panelist.smellScore),
    colorScore: panelist.colorScore == null ? "" : String(panelist.colorScore),
    homogeneityScore:
      panelist.homogeneityScore == null
        ? ""
        : String(panelist.homogeneityScore),
    appearanceScore:
      panelist.appearanceScore == null ? "" : String(panelist.appearanceScore),
    overallScore:
      panelist.overallScore == null ? "" : String(panelist.overallScore),
    comments: panelist.comments ?? "",
  };
}

function toNumberOrNull(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDefaultParameters(
  test: ShelfLifeTest,
): ResultDraft["parameters"] {
  const migration = migrationTemplateByPackaging(test.packagingType);

  return [
    ...MICRO_TEMPLATE.map((item) => ({
      group: "MICRO" as const,
      parameterKey: item.key,
      unit: "",
      normativeText: item.norm,
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    })),
    ...PHYS_CHEM_TEMPLATE.map((item) => ({
      group: "PHYS_CHEM" as const,
      parameterKey: item.key,
      unit: "",
      normativeText: item.norm,
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    })),
    {
      group: "CO2" as const,
      parameterKey: "specific_decarb_time",
      unit: "day",
      normativeText: "Must be ≤300",
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    },
    {
      group: "CO2" as const,
      parameterKey: "end_of_life_co2_ratio",
      unit: "%",
      normativeText: "End-of-life CO2 must be ≥90% of initial",
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    },
    ...migration.map((key) => ({
      group: "MIGRATION" as const,
      parameterKey: key,
      unit: "",
      normativeText: "Per market requirement",
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    })),
    {
      group: "VISUAL" as const,
      parameterKey: "hermeticity",
      unit: "",
      normativeText: "No leakage; geometry and marking intact",
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    },
    {
      group: "COATING" as const,
      parameterKey: "corrosion_oxidation",
      unit: "",
      normativeText: "No corrosion/oxidation traces",
      valueText: "",
      valueNumber: "",
      passFail: "NOT_SET" as const,
      comment: "",
    },
  ];
}

export default function ShelfLifeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [test, setTest] = useState<ShelfLifeTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [draft, setDraft] = useState<ResultDraft | null>(null);
  const [savingResult, setSavingResult] = useState(false);
  const [savingConclusion, setSavingConclusion] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "results" | "summary" | "activity"
  >("results");
  const [activityLogs, setActivityLogs] = useState<ShelfLifeActivityLog[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () =>
      test?.samplingEvents.find((event) => event.id === selectedEventId) ??
      null,
    [test, selectedEventId],
  );

  const baselineOrganolepticMean = useMemo(() => {
    const zero = test?.samplingEvents.find((event) => event.type === "ZERO");
    const scores = zero?.testResult?.organolepticPanelists
      .map((panelist) => panelist.overallScore)
      .filter((value): value is number => value != null);

    if (!scores || scores.length === 0) {
      return null;
    }

    return scores.reduce((sum, value) => sum + value, 0) / scores.length;
  }, [test]);

  const currentOrganolepticMean = useMemo(() => {
    if (!draft) {
      return null;
    }

    const scores = draft.panelists
      .map((panelist) => toNumberOrNull(panelist.overallScore))
      .filter((value): value is number => value != null);

    if (scores.length === 0) {
      return null;
    }

    return scores.reduce((sum, value) => sum + value, 0) / scores.length;
  }, [draft]);

  const deteriorationPct = useMemo(() => {
    if (!baselineOrganolepticMean || !currentOrganolepticMean) {
      return null;
    }

    if (baselineOrganolepticMean === 0) {
      return null;
    }

    return (
      ((baselineOrganolepticMean - currentOrganolepticMean) /
        baselineOrganolepticMean) *
      100
    );
  }, [baselineOrganolepticMean, currentOrganolepticMean]);

  const loadTest = useCallback(async () => {
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
            `Failed to load test (HTTP ${response.status}).`,
        );
      }

      const row = data as ShelfLifeTest;
      setTest(row);

      const firstEvent = row.samplingEvents[0];
      if (firstEvent) {
        setSelectedEventId(firstEvent.id);
      }
    } catch (fetchError: unknown) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load test.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTest();
  }, [loadTest]);

  const loadActivity = useCallback(
    async (append: boolean, cursor?: string | null) => {
      setActivityLoading(true);
      setActivityError(null);

      try {
        const params = new URLSearchParams({
          testId: id,
          limit: "20",
        });

        if (cursor) {
          params.set("cursor", cursor);
        }

        const response = await fetch(`/api/shelf-life-activity?${params}`, {
          cache: "no-store",
        });
        const data = await readJsonSafe<
          | { items: ShelfLifeActivityLog[]; nextCursor: string | null }
          | ApiErrorResponse
        >(response);

        if (!response.ok) {
          throw new Error(
            (data as ApiErrorResponse | null)?.error?.message ||
              `Failed to load activity (HTTP ${response.status}).`,
          );
        }

        const payload = (data as {
          items: ShelfLifeActivityLog[];
          nextCursor: string | null;
        }) ?? { items: [], nextCursor: null };

        setActivityLogs((prev) =>
          append ? [...prev, ...payload.items] : (payload.items ?? []),
        );
        setActivityCursor(payload.nextCursor ?? null);
      } catch (fetchError: unknown) {
        setActivityError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load activity.",
        );
      } finally {
        setActivityLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (activeTab !== "activity") {
      return;
    }

    void loadActivity(false);
  }, [activeTab, loadActivity]);

  useEffect(() => {
    if (!selectedEvent || !test) {
      return;
    }

    const existing = selectedEvent.testResult;
    if (existing) {
      setDraft({
        summaryStatus: existing.summaryStatus ?? "",
        deviationNotes: existing.deviationNotes ?? "",
        parameters: existing.parameterResults.map(parameterToDraft),
        panelists: existing.organolepticPanelists.map(panelistToDraft),
      });
      return;
    }

    setDraft({
      summaryStatus: "",
      deviationNotes: "",
      parameters: buildDefaultParameters(test),
      panelists: Array.from({ length: 7 }).map((_, index) => ({
        panelistCode: `P-${index + 1}`,
        tasteScore: "",
        smellScore: "",
        colorScore: "",
        homogeneityScore: "",
        appearanceScore: "",
        overallScore: "",
        comments: "",
      })),
    });
  }, [selectedEvent, test]);

  function updateParameter(
    index: number,
    patch: Partial<ResultDraft["parameters"][number]>,
  ) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            parameters: prev.parameters.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item,
            ),
          }
        : prev,
    );
  }

  function updatePanelist(
    index: number,
    patch: Partial<ResultDraft["panelists"][number]>,
  ) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            panelists: prev.panelists.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item,
            ),
          }
        : prev,
    );
  }

  async function markEventStatus(
    status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED",
  ) {
    if (!selectedEvent) {
      return;
    }

    const sampleCode = generateSampleLabel(
      test?.testNumber ?? "SLT",
      selectedEvent.dayOffset,
      0,
    );

    try {
      const response = await fetch(
        `/api/shelf-life/${id}/events/${selectedEvent.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            sampleCode,
          }),
        },
      );

      const data = await readJsonSafe<ApiErrorResponse>(response);
      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            `Failed to update event status (HTTP ${response.status}).`,
        );
      }

      await loadTest();
    } catch (statusError: unknown) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update event status.",
      );
    }
  }

  async function saveResult() {
    if (!selectedEvent || !draft) {
      return;
    }

    const filledPanelists = draft.panelists.filter(
      (panelist) => panelist.panelistCode.trim().length > 0,
    );
    if (filledPanelists.length < 7) {
      setError(
        "Need at least 7 panelists before finalizing organoleptic result.",
      );
      return;
    }

    if (deteriorationPct != null && deteriorationPct > 20) {
      setError(
        "Organoleptic deterioration exceeds 20% vs baseline. Add deviation notes before save.",
      );
      return;
    }

    setSavingResult(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/shelf-life/${id}/events/${selectedEvent.id}/result`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summaryStatus: draft.summaryStatus || null,
            deviationNotes: draft.deviationNotes || null,
            parameters: draft.parameters.map((item) => ({
              group: item.group,
              parameterKey: item.parameterKey,
              unit: item.unit || null,
              normativeText: item.normativeText || null,
              valueText: item.valueText || null,
              valueNumber: toNumberOrNull(item.valueNumber),
              passFail: item.passFail,
              comment: item.comment || null,
            })),
            panelists: filledPanelists.map((item) => ({
              panelistCode: item.panelistCode,
              tasteScore: toNumberOrNull(item.tasteScore),
              smellScore: toNumberOrNull(item.smellScore),
              colorScore: toNumberOrNull(item.colorScore),
              homogeneityScore: toNumberOrNull(item.homogeneityScore),
              appearanceScore: toNumberOrNull(item.appearanceScore),
              overallScore: toNumberOrNull(item.overallScore),
              comments: item.comments || null,
            })),
          }),
        },
      );

      const data = await readJsonSafe<ApiErrorResponse>(response);
      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            `Failed to save result (HTTP ${response.status}).`,
        );
      }

      await loadTest();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save result.",
      );
    } finally {
      setSavingResult(false);
    }
  }

  async function saveConclusions() {
    if (!test) {
      return;
    }

    setSavingConclusion(true);
    setError(null);

    try {
      const response = await fetch(`/api/shelf-life/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: test.status,
          finalRecommendation: test.finalRecommendation,
          reserveCoefficientEnabled: test.reserveCoefficientEnabled,
          approvedByNpd: test.approvedByNpd,
          approvedByNpdDate: test.approvedByNpdDate,
          approvedByQuality: test.approvedByQuality,
          approvedByQualityDate: test.approvedByQualityDate,
          notes: test.notes,
        }),
      });

      const data = await readJsonSafe<ApiErrorResponse>(response);
      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            `Failed to save conclusion details (HTTP ${response.status}).`,
        );
      }

      await loadTest();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save conclusion.",
      );
    } finally {
      setSavingConclusion(false);
    }
  }

  const co2Calculator = useMemo(() => {
    if (!test || !draft) {
      return null;
    }

    const c0 = test.co2AtFilling ?? 0;
    const c = toNumberOrNull(
      draft.parameters.find(
        (item) => item.parameterKey === "end_of_life_co2_ratio",
      )?.valueNumber ?? "",
    );

    const specificTime =
      selectedEvent && c != null && c0 > 0
        ? computeSpecificDecarbTime({
            tDays: selectedEvent.dayOffset,
            c0,
            c,
          })
        : Number.NaN;

    const requiredDays =
      c != null && c0 > 0
        ? computeRequiredDecarbDuration({
            c0,
            ct: c0 * 0.9,
            targetSpecificTime: 300,
          })
        : Number.NaN;

    return {
      specificTime,
      requiredDays,
      endPass: c != null ? co2EndOfLifePass(c0, c) : false,
    };
  }, [draft, selectedEvent, test]);

  if (loading) {
    return (
      <main className="py-6">
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Loading shelf-life test...
        </div>
      </main>
    );
  }

  if (!test) {
    return (
      <main className="py-6">
        <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          Shelf-life test not found.
        </div>
      </main>
    );
  }

  return (
    <main className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {test.testNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {test.productName} · {test.packagingType} ·{" "}
            {Math.round(test.plannedShelfLifeDays / 30)} months
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/shelf-life"
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to list
          </Link>
          <Link
            href={`/shelf-life/${test.id}/report`}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Printable report
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 inline-flex rounded-md border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`rounded px-3 py-1.5 text-sm ${
            activeTab === "results"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Results
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`rounded px-3 py-1.5 text-sm ${
            activeTab === "summary"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`rounded px-3 py-1.5 text-sm ${
            activeTab === "activity"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Activity
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {test.status.replace("_", " ")}
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Start date
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {formatDate(test.startDate)}
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Conditions
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {test.conditions.length}
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Sampling events
          </p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {test.samplingEvents.length}
          </p>
        </article>
      </div>

      {activeTab === "results" ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            Execution & sampling checklist
          </h2>
          <div className="mt-3 overflow-x-auto rounded border border-gray-200">
            <table className="w-full min-w-240 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Offset</th>
                  <th className="px-3 py-2">Condition</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Packs</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {test.samplingEvents.map((event, index) => (
                  <tr key={event.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      {formatDate(event.plannedDate)}
                    </td>
                    <td className="px-3 py-2">D+{event.dayOffset}</td>
                    <td className="px-3 py-2">
                      {event.condition?.type?.replaceAll("_", " ") ?? "—"}
                    </td>
                    <td className="px-3 py-2">{event.type}</td>
                    <td className="px-3 py-2">{event.requiredPacks}</td>
                    <td className="px-3 py-2">{event.status}</td>
                    <td className="px-3 py-2">
                      {event.sampleCode ??
                        generateSampleLabel(
                          test.testNumber,
                          event.dayOffset,
                          index,
                        )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(event.id)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Enter results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "results" && selectedEvent && draft ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">
              Results entry · D+{selectedEvent.dayOffset} ({selectedEvent.type})
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => markEventStatus("IN_PROGRESS")}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Mark In Progress
              </button>
              <button
                type="button"
                onClick={() => markEventStatus("DONE")}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Mark Done
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border border-gray-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Parameters
              </p>
              <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
                {draft.parameters.map((parameter, index) => (
                  <div
                    key={`${parameter.group}-${parameter.parameterKey}-${index}`}
                    className="rounded border border-gray-200 p-2"
                  >
                    <p className="text-xs font-semibold text-gray-700">
                      [{parameter.group}] {parameter.parameterKey}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Norm: {parameter.normativeText || "—"}
                    </p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input
                        value={parameter.valueText}
                        onChange={(e) =>
                          updateParameter(index, { valueText: e.target.value })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Text value"
                      />
                      <input
                        value={parameter.valueNumber}
                        onChange={(e) =>
                          updateParameter(index, {
                            valueNumber: e.target.value,
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Numeric value"
                      />
                      <select
                        value={parameter.passFail}
                        onChange={(e) =>
                          updateParameter(index, {
                            passFail: e.target
                              .value as ResultDraft["parameters"][number]["passFail"],
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="NOT_SET">Not set</option>
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                      </select>
                      <input
                        value={parameter.comment}
                        onChange={(e) =>
                          updateParameter(index, { comment: e.target.value })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Deviation comment"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded border border-gray-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Organoleptic panel
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  At least 7 unbiased panelists. Deterioration must not exceed
                  20% vs baseline.
                </p>
                <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {draft.panelists.map((panelist, index) => (
                    <div
                      key={`panel-${index}`}
                      className="grid gap-2 md:grid-cols-3"
                    >
                      <input
                        value={panelist.panelistCode}
                        onChange={(e) =>
                          updatePanelist(index, {
                            panelistCode: e.target.value,
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Panelist code"
                      />
                      <input
                        value={panelist.overallScore}
                        onChange={(e) =>
                          updatePanelist(index, {
                            overallScore: e.target.value,
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Overall 0-5"
                      />
                      <input
                        value={panelist.comments}
                        onChange={(e) =>
                          updatePanelist(index, { comments: e.target.value })
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Comment"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-700">
                  Mean:{" "}
                  {currentOrganolepticMean != null
                    ? currentOrganolepticMean.toFixed(2)
                    : "—"}
                  {deteriorationPct != null
                    ? ` · Deterioration: ${deteriorationPct.toFixed(2)}%`
                    : ""}
                </div>
              </div>

              <div className="rounded border border-gray-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  CO2 calculation details
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  T = t / ((C0 / C) - 1) ; t = (C0 - Ct) * T / Ct
                </p>
                <div className="mt-2 text-xs text-gray-700">
                  Specific decarbonization time:{" "}
                  {Number.isFinite(co2Calculator?.specificTime ?? Number.NaN)
                    ? (co2Calculator?.specificTime ?? 0).toFixed(2)
                    : "—"}
                </div>
                <div className="text-xs text-gray-700">
                  Required duration for Ct(90% C0):{" "}
                  {Number.isFinite(co2Calculator?.requiredDays ?? Number.NaN)
                    ? (co2Calculator?.requiredDays ?? 0).toFixed(2)
                    : "—"}
                </div>
                <div
                  className={`mt-1 text-xs font-semibold ${co2Calculator?.endPass ? "text-emerald-700" : "text-red-700"}`}
                >
                  End-of-life CO2 rule:{" "}
                  {co2Calculator?.endPass ? "PASS (≥90%)" : "CHECK"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={draft.summaryStatus}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, summaryStatus: e.target.value } : prev,
                )
              }
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Summary status"
            />
            <input
              value={draft.deviationNotes}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, deviationNotes: e.target.value } : prev,
                )
              }
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Deviation notes"
            />
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={saveResult}
              disabled={savingResult}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {savingResult ? "Saving..." : "Save result"}
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "summary" ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            Conclusions & approvals
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={test.status}
                onChange={(e) =>
                  setTest((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: e.target.value as ShelfLifeTest["status"],
                        }
                      : prev,
                  )
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={test.reserveCoefficientEnabled}
                onChange={(e) =>
                  setTest((prev) =>
                    prev
                      ? { ...prev, reserveCoefficientEnabled: e.target.checked }
                      : prev,
                  )
                }
              />
              Apply reserve coefficient 1.15
            </label>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                NPD manager
              </label>
              <input
                value={test.approvedByNpd ?? ""}
                onChange={(e) =>
                  setTest((prev) =>
                    prev ? { ...prev, approvedByNpd: e.target.value } : prev,
                  )
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Quality manager
              </label>
              <input
                value={test.approvedByQuality ?? ""}
                onChange={(e) =>
                  setTest((prev) =>
                    prev
                      ? { ...prev, approvedByQuality: e.target.value }
                      : prev,
                  )
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Final recommendation
              </label>
              <textarea
                value={test.finalRecommendation ?? ""}
                onChange={(e) =>
                  setTest((prev) =>
                    prev
                      ? { ...prev, finalRecommendation: e.target.value }
                      : prev,
                  )
                }
                className="min-h-24 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="Summarize pass/fail and shelf-life recommendation"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={saveConclusions}
              disabled={savingConclusion}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {savingConclusion ? "Saving..." : "Save conclusions"}
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="mt-4 space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            Activity logs capture who changed this test and related records.
          </div>
          <ActivityFeed
            logs={activityLogs}
            loading={activityLoading}
            error={activityError}
            nextCursor={activityCursor}
            onLoadMore={() => void loadActivity(true, activityCursor)}
          />
        </section>
      ) : null}
    </main>
  );
}
