import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createOrUpdateDevIngredientOverride,
  isDatabaseUnavailable,
} from "@/lib/dev-data-store";

const scopeTypeSchema = z.enum(["global", "project", "formulation"]);

const overridePayloadSchema = z.object({
  ingredientId: z.string().min(1, "ingredientId is required."),
  scopeType: scopeTypeSchema,
  scopeId: z.string().trim().optional().nullable(),
  overridePricePerKgEur: z.number().optional().nullable(),
  overrideDensityKgPerL: z.number().optional().nullable(),
  overrideBrixPercent: z.number().optional().nullable(),
  overrideTitratableAcidityPercent: z.number().optional().nullable(),
  overridePH: z.number().optional().nullable(),
  overrideWaterContentPercent: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = overridePayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid payload.",
        },
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (payload.scopeType !== "global" && !payload.scopeId) {
    return NextResponse.json(
      {
        error: {
          message: "scopeId is required for project/formulation scopes.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const normalizedScopeId =
      payload.scopeType === "global" ? null : (payload.scopeId ?? null);

    const existing = await prisma.ingredientOverride.findFirst({
      where: {
        ingredientId: payload.ingredientId,
        scopeType: payload.scopeType,
        scopeId: normalizedScopeId,
      },
      select: { id: true },
    });

    const upserted = existing
      ? await prisma.ingredientOverride.update({
          where: { id: existing.id },
          data: {
            overridePricePerKgEur: payload.overridePricePerKgEur,
            overrideDensityKgPerL: payload.overrideDensityKgPerL,
            overrideBrixPercent: payload.overrideBrixPercent,
            overrideTitratableAcidityPercent:
              payload.overrideTitratableAcidityPercent,
            overridePH: payload.overridePH,
            overrideWaterContentPercent: payload.overrideWaterContentPercent,
            notes: payload.notes ?? null,
          },
        })
      : await prisma.ingredientOverride.create({
          data: {
            ingredientId: payload.ingredientId,
            scopeType: payload.scopeType,
            scopeId: normalizedScopeId,
            overridePricePerKgEur: payload.overridePricePerKgEur,
            overrideDensityKgPerL: payload.overrideDensityKgPerL,
            overrideBrixPercent: payload.overrideBrixPercent,
            overrideTitratableAcidityPercent:
              payload.overrideTitratableAcidityPercent,
            overridePH: payload.overridePH,
            overrideWaterContentPercent: payload.overrideWaterContentPercent,
            notes: payload.notes ?? null,
          },
        });

    return NextResponse.json(upserted, { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const upserted = createOrUpdateDevIngredientOverride({
        ingredientId: payload.ingredientId,
        scopeType: payload.scopeType,
        scopeId:
          payload.scopeType === "global" ? null : (payload.scopeId ?? null),
        overridePricePerKgEur: payload.overridePricePerKgEur,
        overrideDensityKgPerL: payload.overrideDensityKgPerL,
        overrideBrixPercent: payload.overrideBrixPercent,
        overrideTitratableAcidityPercent:
          payload.overrideTitratableAcidityPercent,
        overridePH: payload.overridePH,
        overrideWaterContentPercent: payload.overrideWaterContentPercent,
        notes: payload.notes ?? null,
      });

      return NextResponse.json(upserted, { status: 201 });
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to save override.",
        },
      },
      { status: 500 },
    );
  }
}
