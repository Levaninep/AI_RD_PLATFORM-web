import { compare, hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { Prisma } from "@/generated/prisma/client/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SettingsRequestBody = {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

function badRequest(message: string) {
  return Response.json({ error: { message } }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  const payload = (await request
    .json()
    .catch(() => null)) as SettingsRequestBody | null;

  const email = payload?.email?.trim().toLowerCase() ?? "";
  const currentPassword = payload?.currentPassword ?? "";
  const newPassword = payload?.newPassword ?? "";

  if (!email) {
    return badRequest("Email is required.");
  }

  if (!currentPassword) {
    return badRequest("Current password is required.");
  }

  if (newPassword && newPassword.length < 8) {
    return badRequest("New password must be at least 8 characters.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return Response.json(
      { error: { message: "User not found." } },
      { status: 404 },
    );
  }

  const passwordValid = await compare(currentPassword, user.password);
  if (!passwordValid) {
    return badRequest("Current password is incorrect.");
  }

  const data: { email?: string; password?: string } = {};

  if (email !== user.email) {
    data.email = email;
  }

  if (newPassword) {
    data.password = await hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ data: { email: user.email } });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { email: true },
    });

    return Response.json({ data: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return badRequest("Email is already in use.");
    }

    throw error;
  }
}
