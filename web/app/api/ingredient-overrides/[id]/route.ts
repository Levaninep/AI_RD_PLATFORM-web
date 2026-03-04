import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  deleteDevIngredientOverride,
  isDatabaseUnavailable,
} from "@/lib/dev-data-store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.ingredientOverride.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const deleted = deleteDevIngredientOverride(id);
      if (!deleted) {
        return NextResponse.json(
          { error: { message: "Override not found." } },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete override.",
        },
      },
      { status: 500 },
    );
  }
}
