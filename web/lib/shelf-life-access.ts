import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type ShelfLifeAccessContext = {
  userId: string;
  isAdmin: boolean;
};

export async function getShelfLifeAccessContext(): Promise<ShelfLifeAccessContext | null> {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return {
    userId,
    isAdmin: isAdminSession(session),
  };
}

export async function canAccessShelfLifeTest(
  testId: string,
  access: ShelfLifeAccessContext,
): Promise<boolean> {
  if (access.isAdmin) {
    return true;
  }

  const ownedTest = await prisma.shelfLifeTest.findFirst({
    where: { id: testId, ownerId: access.userId },
    select: { id: true },
  });

  return Boolean(ownedTest);
}
