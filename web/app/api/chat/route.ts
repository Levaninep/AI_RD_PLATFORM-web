import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: { message: "AI assistance is not currently available." } },
    { status: 404 },
  );
}
