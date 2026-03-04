import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Required env vars:
// - NEXTAUTH_SECRET: used to sign/encrypt JWT/session tokens
// - NEXTAUTH_URL: canonical app URL (e.g. http://localhost:3000)
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
