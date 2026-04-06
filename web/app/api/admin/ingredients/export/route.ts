import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isDatabaseUnavailable,
  listDevIngredients,
} from "@/lib/dev-data-store";

const CSV_COLUMNS = [
  "Ingredient Name",
  "Category",
  "Supplier",
  "Country of Origin",
  "Price per kg (EUR)",
  "Density (kg/L)",
  "Brix (%)",
  "Single Strength Brix (%)",
  "Titratable Acidity (%)",
  "pH",
  "CO2 Solubility Relevant (Yes/No)",
  "Water Content (%)",
  "Shelf-life (months)",
  "Storage Conditions",
  "Allergen Info",
  "Vegan (Yes/No)",
  "Natural (Yes/No)",
  "Notes",
  "Created At",
  "Updated At",
] as const;

function csvEscape(value: unknown): string {
  if (value == null) {
    return "";
  }

  const text = String(value);
  if (
    text.includes(",") ||
    text.includes("\n") ||
    text.includes("\r") ||
    text.includes('"')
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function boolToYesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function dateToIso(value: Date): string {
  return value.toISOString();
}

function toCsvLine(values: unknown[]): string {
  return values.map(csvEscape).join(",");
}

function toCsv(
  rows: Array<{
    ingredientName: string;
    category: string;
    supplier: string;
    countryOfOrigin: string;
    pricePerKgEur: number;
    densityKgPerL: number | null;
    brixPercent: number | null;
    singleStrengthBrix: number | null;
    titratableAcidityPercent: number | null;
    pH: number | null;
    co2SolubilityRelevant: boolean;
    waterContentPercent: number | null;
    shelfLifeMonths: number | null;
    storageConditions: string | null;
    allergenInfo: string | null;
    vegan: boolean;
    natural: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>,
): string {
  const lines = [toCsvLine([...CSV_COLUMNS])];

  for (const row of rows) {
    lines.push(
      toCsvLine([
        row.ingredientName,
        row.category,
        row.supplier,
        row.countryOfOrigin,
        row.pricePerKgEur,
        row.densityKgPerL,
        row.brixPercent,
        row.singleStrengthBrix,
        row.titratableAcidityPercent,
        row.pH,
        boolToYesNo(row.co2SolubilityRelevant),
        row.waterContentPercent,
        row.shelfLifeMonths,
        row.storageConditions,
        row.allergenInfo,
        boolToYesNo(row.vegan),
        boolToYesNo(row.natural),
        row.notes,
        dateToIso(row.createdAt),
        dateToIso(row.updatedAt),
      ]),
    );
  }

  return `${lines.join("\n")}\n`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403 },
    );
  }

  try {
    const rows = await prisma.ingredient.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        ingredientName: true,
        category: true,
        supplier: true,
        countryOfOrigin: true,
        pricePerKgEur: true,
        densityKgPerL: true,
        brixPercent: true,
        singleStrengthBrix: true,
        titratableAcidityPercent: true,
        pH: true,
        co2SolubilityRelevant: true,
        waterContentPercent: true,
        shelfLifeMonths: true,
        storageConditions: true,
        allergenInfo: true,
        vegan: true,
        natural: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ingredients_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: {
            message:
              error instanceof Error ? error.message : "Failed to export CSV.",
          },
        },
        { status: 500 },
      );
    }

    const fallbackRows = listDevIngredients().map((item) => ({
      ingredientName: item.ingredientName,
      category: item.category,
      supplier: item.supplier,
      countryOfOrigin: item.countryOfOrigin,
      pricePerKgEur: item.pricePerKgEur,
      densityKgPerL: item.densityKgPerL,
      brixPercent: item.brixPercent,
      singleStrengthBrix: item.singleStrengthBrix,
      titratableAcidityPercent: item.titratableAcidityPercent,
      pH: item.pH,
      co2SolubilityRelevant: item.co2SolubilityRelevant,
      waterContentPercent: item.waterContentPercent,
      shelfLifeMonths: item.shelfLifeMonths,
      storageConditions: item.storageConditions,
      allergenInfo: item.allergenInfo,
      vegan: item.vegan,
      natural: item.natural,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const csv = toCsv(fallbackRows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ingredients_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
}
