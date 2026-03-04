"use client";

import { useMemo, useState } from "react";

type PreviewRow = {
  ingredientName: string;
  category: string;
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  brixPercent?: number;
  singleStrengthBrix?: number;
  titratableAcidityPercent?: number;
};

type PreviewResponse = {
  previewRows: PreviewRow[];
  warnings: string[];
  skippedCount: number;
  totalParsedRows: number;
};

type ImportResponse = {
  inserted: number;
  updated: number;
  skipped: number;
  warnings: string[];
  totalProcessed: number;
};

async function postFile<T>(file: File, preview: boolean): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("preview", String(preview));

  const response = await fetch("/api/admin/ingredients/import", {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed.");
  }

  return data as T;
}

export default function AdminIngredientsImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [summary, setSummary] = useState<ImportResponse | null>(null);

  const canRun = useMemo(
    () => Boolean(file) && !loadingPreview && !importing,
    [file, loadingPreview, importing],
  );

  async function handlePreview() {
    if (!file) return;

    setError(null);
    setSummary(null);
    setLoadingPreview(true);

    try {
      const data = await postFile<PreviewResponse>(file, true);
      setPreview(data);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Preview failed.",
      );
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleImport() {
    if (!file) return;

    setError(null);
    setImporting(true);

    try {
      const data = await postFile<ImportResponse>(file, false);
      setSummary(data);
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Import failed.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="space-y-5 p-6">
      <section className="rounded-xl border border-blue-100 bg-white p-5">
        <h1 className="text-xl font-semibold text-slate-900">
          Admin · Ingredients Excel Import
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload AI_RD_Ingredients_Database_Template.xlsx and import
          Ingredients_Database sheet.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setSummary(null);
              setError(null);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            onClick={() => void handlePreview()}
            disabled={!canRun}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {loadingPreview ? "Previewing..." : "Preview"}
          </button>
          <button
            onClick={() => void handleImport()}
            disabled={!canRun}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import / Upsert"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {summary ? (
        <section className="rounded-xl border border-blue-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Import Summary
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded border border-slate-200 p-3 text-sm">
              Inserted:{" "}
              <span className="font-semibold">{summary.inserted}</span>
            </div>
            <div className="rounded border border-slate-200 p-3 text-sm">
              Updated: <span className="font-semibold">{summary.updated}</span>
            </div>
            <div className="rounded border border-slate-200 p-3 text-sm">
              Skipped: <span className="font-semibold">{summary.skipped}</span>
            </div>
            <div className="rounded border border-slate-200 p-3 text-sm">
              Processed:{" "}
              <span className="font-semibold">{summary.totalProcessed}</span>
            </div>
          </div>
          {summary.warnings.length > 0 ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-700">
              {summary.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {preview ? (
        <section className="rounded-xl border border-blue-100 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Preview (normalized first 20 rows)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Parsed: {preview.totalParsedRows} rows, skipped:{" "}
            {preview.skippedCount}
          </p>

          <div className="mt-4 overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-3 py-2">Ingredient</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">Price/kg EUR</th>
                  <th className="px-3 py-2">Brix</th>
                  <th className="px-3 py-2">Single Strength Brix</th>
                  <th className="px-3 py-2">Acidity</th>
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.map((row, index) => (
                  <tr
                    key={`${row.ingredientName}-${index}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-3 py-2">{row.ingredientName}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.supplier}</td>
                    <td className="px-3 py-2">{row.countryOfOrigin}</td>
                    <td className="px-3 py-2">{row.pricePerKgEur}</td>
                    <td className="px-3 py-2">{row.brixPercent ?? "—"}</td>
                    <td className="px-3 py-2">
                      {row.singleStrengthBrix ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.titratableAcidityPercent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.warnings.length > 0 ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-700">
              {preview.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
