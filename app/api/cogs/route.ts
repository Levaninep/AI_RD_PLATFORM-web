import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCogsForFormulation } from "@/lib/cogs";
import {
  isDatabaseUnavailable,
  listDevFormulations,
} from "@/lib/dev-data-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const formulationId = url.searchParams.get("formulationId")?.trim() ?? "";

  try {
    if (formulationId) {
      const formulation = await prisma.formulation.findUnique({
        where: { id: formulationId },
        include: {
          ingredients: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  ingredientName: true,
                  pricePerKgEur: true,
                },
              },
            },
          },
        },
      });

      if (!formulation) {
        return NextResponse.json(
          { error: { message: "Formulation not found." } },
          { status: 404 },
        );
      }

      return NextResponse.json(computeCogsForFormulation(formulation));
    }

    const formulations = await prisma.formulation.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                ingredientName: true,
                pricePerKgEur: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(formulations.map(computeCogsForFormulation));
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const devFormulations = listDevFormulations();

      if (formulationId) {
        const match = devFormulations.find((item) => item.id === formulationId);
        if (!match) {
          return NextResponse.json(
            { error: { message: "Formulation not found." } },
            { status: 404 },
          );
        }

        return NextResponse.json(computeCogsForFormulation(match));
      }

      return NextResponse.json(devFormulations.map(computeCogsForFormulation));
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load COGS data.",
        },
      },
      { status: 500 },
    );
  }
}
