import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        category: String(body?.category ?? "Other"),
        pricePerKg: Number(body?.pricePerKg ?? 0),
        supplier: body?.supplier ? String(body.supplier) : null,
        density: body?.density == null ? null : Number(body.density),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: { message: e instanceof Error ? e.message : "Server error" } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: { message: e instanceof Error ? e.message : "Server error" } },
      { status: 500 },
    );
  }
}
