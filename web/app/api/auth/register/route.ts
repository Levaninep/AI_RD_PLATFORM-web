import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: {
        message:
          "BevOrigin R&D Workspace is invitation-only. Request access at https://app.bevorigin.com/request-access.",
      },
    },
    { status: 403 },
  );
}
