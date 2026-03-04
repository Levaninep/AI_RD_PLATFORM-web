import { NextResponse } from "next/server";
import { getEffectiveIngredientSpec } from "@/lib/ingredient-effective";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const scopeType = (
    url.searchParams.get("scopeType") ?? "global"
  ).toLowerCase();
  const scopeId = url.searchParams.get("scopeId");
  const projectId =
    scopeType === "project" ? scopeId : url.searchParams.get("projectId");
  const formulationId =
    scopeType === "formulation"
      ? scopeId
      : url.searchParams.get("formulationId");

  const effective = await getEffectiveIngredientSpec(id, {
    projectId,
    formulationId,
  });

  if (!effective) {
    return NextResponse.json(
      { error: { message: "Ingredient not found." } },
      { status: 404 },
    );
  }

  return NextResponse.json(effective);
}
