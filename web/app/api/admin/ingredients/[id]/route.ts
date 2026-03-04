import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  countDevFormulationsUsingIngredient,
  deleteDevIngredient,
  getDevIngredientById,
  hasDevIngredientOverrides,
  isDatabaseUnavailable,
  updateDevIngredient,
} from "@/lib/dev-data-store";
import {
  adminIngredientUpdateSchema,
  toDeleteBlockedMessage,
} from "@/lib/admin-ingredient";
import { isAdminToken } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { toPrismaIngredientCategory } from "@/lib/ingredient";

const AUTH_SECRET = env.NEXTAUTH_SECRET;

function jsonUnauthorized() {
  return NextResponse.json(
    { error: { message: "Forbidden" } },
    { status: 403 },
  );
}

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: AUTH_SECRET });
  return isAdminToken(token);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin(req))) {
    return jsonUnauthorized();
  }

  const { id } = await params;

  try {
    const item = await prisma.ingredient.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            overrides: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: { message: "Ingredient not found." } },
        { status: 404 },
      );
    }

    const formulations = await prisma.formulationIngredient.findMany({
      where: { ingredientId: id },
      select: { formulationId: true },
      distinct: ["formulationId"],
    });

    return NextResponse.json({
      ...item,
      name: item.ingredientName,
      hasOverrides: item._count.overrides > 0,
      formulationsCount: formulations.length,
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : "Server error",
          },
        },
        { status: 500 },
      );
    }

    const item = getDevIngredientById(id);
    if (!item) {
      return NextResponse.json(
        { error: { message: "Ingredient not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...item,
      hasOverrides: hasDevIngredientOverrides(id),
      formulationsCount: countDevFormulationsUsingIngredient(id),
    });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin(req))) {
    return jsonUnauthorized();
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = adminIngredientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid payload.",
          issues: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(payload.ingredientName !== undefined
          ? { ingredientName: payload.ingredientName }
          : {}),
        ...(payload.category !== undefined
          ? { category: toPrismaIngredientCategory(payload.category) }
          : {}),
        ...(payload.supplier !== undefined
          ? { supplier: payload.supplier }
          : {}),
        ...(payload.countryOfOrigin !== undefined
          ? { countryOfOrigin: payload.countryOfOrigin }
          : {}),
        ...(payload.pricePerKgEur !== undefined
          ? { pricePerKgEur: payload.pricePerKgEur }
          : {}),
        ...(payload.densityKgPerL !== undefined
          ? { densityKgPerL: payload.densityKgPerL ?? null }
          : {}),
        ...(payload.brixPercent !== undefined
          ? { brixPercent: payload.brixPercent ?? null }
          : {}),
        ...(payload.singleStrengthBrix !== undefined
          ? { singleStrengthBrix: payload.singleStrengthBrix ?? null }
          : {}),
        ...(payload.titratableAcidityPercent !== undefined
          ? {
              titratableAcidityPercent:
                payload.titratableAcidityPercent ?? null,
            }
          : {}),
        ...(payload.pH !== undefined ? { pH: payload.pH ?? null } : {}),
        ...(payload.co2SolubilityRelevant !== undefined
          ? { co2SolubilityRelevant: payload.co2SolubilityRelevant }
          : {}),
        ...(payload.waterContentPercent !== undefined
          ? { waterContentPercent: payload.waterContentPercent ?? null }
          : {}),
        ...(payload.shelfLifeMonths !== undefined
          ? { shelfLifeMonths: payload.shelfLifeMonths ?? null }
          : {}),
        ...(payload.storageConditions !== undefined
          ? { storageConditions: payload.storageConditions ?? null }
          : {}),
        ...(payload.allergenInfo !== undefined
          ? { allergenInfo: payload.allergenInfo ?? null }
          : {}),
        ...(payload.vegan !== undefined ? { vegan: payload.vegan } : {}),
        ...(payload.natural !== undefined ? { natural: payload.natural } : {}),
        ...(payload.notes !== undefined
          ? { notes: payload.notes ?? null }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : "Server error",
          },
        },
        { status: 500 },
      );
    }

    const updated = updateDevIngredient(id, payload);
    if (!updated) {
      return NextResponse.json(
        { error: { message: "Ingredient not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin(req))) {
    return jsonUnauthorized();
  }

  const { id } = await params;

  try {
    const formulations = await prisma.formulationIngredient.findMany({
      where: { ingredientId: id },
      select: { formulationId: true },
      distinct: ["formulationId"],
    });

    if (formulations.length > 0) {
      return NextResponse.json(
        {
          error: {
            message: toDeleteBlockedMessage(formulations.length),
            formulationsCount: formulations.length,
          },
        },
        { status: 409 },
      );
    }

    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : "Server error",
          },
        },
        { status: 500 },
      );
    }

    const formulationsCount = countDevFormulationsUsingIngredient(id);
    if (formulationsCount > 0) {
      return NextResponse.json(
        {
          error: {
            message: toDeleteBlockedMessage(formulationsCount),
            formulationsCount,
          },
        },
        { status: 409 },
      );
    }

    const deleted = deleteDevIngredient(id);
    if (!deleted) {
      return NextResponse.json(
        { error: { message: "Ingredient not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  }
}
