import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  createDevIngredient,
  isDatabaseUnavailable,
  listDevIngredients,
  updateDevIngredient,
} from "@/lib/dev-data-store";
import { parseIngredientWorkbook } from "@/lib/ingredient-import";
import { toPrismaIngredientCategory } from "@/lib/ingredient";
import { isAdminToken } from "@/lib/admin-auth";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const AUTH_SECRET = env.NEXTAUTH_SECRET;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: AUTH_SECRET });
  if (!isAdminToken(token)) {
    return NextResponse.json(
      { error: { message: "Forbidden" } },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const preview = String(formData.get("preview") ?? "false") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: { message: "Missing .xlsx file in `file` form field." } },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseIngredientWorkbook(buffer);

    if (preview) {
      return NextResponse.json({
        previewRows: parsed.rows.slice(0, 20),
        warnings: parsed.warnings,
        skippedCount: parsed.skippedCount,
        totalParsedRows: parsed.rows.length,
      });
    }

    let inserted = 0;
    let updated = 0;

    try {
      for (const row of parsed.rows) {
        const existing = await prisma.ingredient.findUnique({
          where: { ingredientName: row.ingredientName },
          select: { id: true },
        });

        const data = {
          ingredientName: row.ingredientName,
          category: toPrismaIngredientCategory(row.category),
          supplier: row.supplier,
          countryOfOrigin: row.countryOfOrigin,
          pricePerKgEur: row.pricePerKgEur,
          densityKgPerL: row.densityKgPerL ?? null,
          brixPercent: row.brixPercent ?? null,
          singleStrengthBrix: row.singleStrengthBrix ?? null,
          titratableAcidityPercent: row.titratableAcidityPercent ?? null,
          pH: row.pH ?? null,
          co2SolubilityRelevant: row.co2SolubilityRelevant,
          waterContentPercent: row.waterContentPercent ?? null,
          shelfLifeMonths:
            row.shelfLifeMonths == null
              ? null
              : Math.round(row.shelfLifeMonths),
          storageConditions: row.storageConditions ?? null,
          allergenInfo: row.allergenInfo ?? null,
          vegan: row.vegan,
          natural: row.natural,
          notes: row.notes ?? null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };

        if (existing) {
          await prisma.ingredient.update({ where: { id: existing.id }, data });
          updated += 1;
        } else {
          await prisma.ingredient.create({ data });
          inserted += 1;
        }
      }

      return NextResponse.json({
        inserted,
        updated,
        skipped: parsed.skippedCount,
        warnings: parsed.warnings,
        totalProcessed: parsed.rows.length + parsed.skippedCount,
      });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      inserted = 0;
      updated = 0;

      for (const row of parsed.rows) {
        const normalizedName = row.ingredientName.trim().toLowerCase();
        const existing = listDevIngredients().find(
          (item) => item.ingredientName.trim().toLowerCase() === normalizedName,
        );

        const data = {
          ingredientName: row.ingredientName,
          category: row.category,
          supplier: row.supplier,
          countryOfOrigin: row.countryOfOrigin,
          pricePerKgEur: row.pricePerKgEur,
          densityKgPerL: row.densityKgPerL ?? null,
          brixPercent: row.brixPercent ?? null,
          singleStrengthBrix: row.singleStrengthBrix ?? null,
          titratableAcidityPercent: row.titratableAcidityPercent ?? null,
          pH: row.pH ?? null,
          co2SolubilityRelevant: row.co2SolubilityRelevant,
          waterContentPercent: row.waterContentPercent ?? null,
          shelfLifeMonths:
            row.shelfLifeMonths == null
              ? null
              : Math.round(row.shelfLifeMonths),
          storageConditions: row.storageConditions ?? null,
          allergenInfo: row.allergenInfo ?? null,
          vegan: row.vegan,
          natural: row.natural,
          notes: row.notes ?? null,
        };

        if (existing) {
          updateDevIngredient(existing.id, data);
          updated += 1;
        } else {
          createDevIngredient(data);
          inserted += 1;
        }
      }

      return NextResponse.json({
        inserted,
        updated,
        skipped: parsed.skippedCount,
        warnings: [
          ...parsed.warnings,
          "Database unavailable. Imported into local dev memory store.",
        ],
        totalProcessed: parsed.rows.length + parsed.skippedCount,
        storage: "dev-memory",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Import failed.",
        },
      },
      { status: 500 },
    );
  }
}
