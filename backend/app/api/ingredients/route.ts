import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.ingredient.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const currencyUnit = body?.currencyUnit;

    if (currencyUnit != null && String(currencyUnit).trim() !== "USD/kg") {
      return NextResponse.json(
        { error: { message: "Only USD/kg currency unit is supported." } },
        { status: 400 },
      );
    }

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: { message: "Name is required." } },
        { status: 400 },
      );
    }

    const created = await prisma.ingredient.create({
      data: {
        name,
        category: String(body?.category ?? "Other"),
        pricePerKg: Number(body?.pricePerKg ?? 0),
        supplier: body?.supplier ? String(body.supplier) : null,
        density: body?.density == null ? null : Number(body.density),
      },
    });

    return NextResponse.json(created);
  } catch (e) {
    return NextResponse.json(
      { error: { message: e instanceof Error ? e.message : "Server error" } },
      { status: 500 },
    );
  }
}
