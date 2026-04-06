import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json(
      { error: { message: "Unauthorized" } },
      { status: 403 },
    );
  }
  const userId = params.id;
  if (!userId) {
    return NextResponse.json(
      { error: { message: "User ID required" } },
      { status: 400 },
    );
  }
  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message } },
      { status: 500 },
    );
  }
}
