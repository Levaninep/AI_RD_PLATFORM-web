import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthTokenFromRequest, isAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = await getAuthTokenFromRequest(req);

  console.log(
    "[admin/database] token:",
    JSON.stringify({
      hasToken: !!token,
      email: token?.email ?? null,
      role: token?.role ?? null,
      sub: token?.sub ?? null,
    }),
  );

  if (!isAdminToken(token)) {
    console.log("[admin/database] isAdminToken returned false");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [
      users,
      ingredients,
      formulations,
      formulationIngredients,
      ingredientOverrides,
      shelfLifeTests,
      samplingEvents,
      testResults,
      co2LossTests,
      activityLogs,
      savedCalories,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { formulations: true, savedCalories: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ingredient.findMany({
        select: {
          id: true,
          ingredientName: true,
          category: true,
          supplier: true,
          pricePerKgEur: true,
          vegan: true,
          natural: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.formulation.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          userId: true,
          targetBrix: true,
          targetPH: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { email: true } },
          _count: { select: { ingredients: true, shelfLifeTests: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.formulationIngredient.count(),
      prisma.ingredientOverride.count(),
      prisma.shelfLifeTest.findMany({
        select: {
          id: true,
          testNumber: true,
          productName: true,
          status: true,
          startDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.samplingEvent.count(),
      prisma.testResult.count(),
      prisma.cO2LossTest.count(),
      prisma.activityLog.count(),
      prisma.savedCaloriesCalculation.count(),
    ]);

    const totalIngredients = await prisma.ingredient.count();
    const totalFormulations = await prisma.formulation.count();

    return NextResponse.json({
      counts: {
        users: users.length,
        ingredients: totalIngredients,
        formulations: totalFormulations,
        formulationIngredients,
        ingredientOverrides,
        shelfLifeTests: shelfLifeTests.length,
        samplingEvents,
        testResults,
        co2LossTests,
        activityLogs,
        savedCalories,
      },
      users,
      ingredients,
      formulations,
      shelfLifeTests,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch database info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
