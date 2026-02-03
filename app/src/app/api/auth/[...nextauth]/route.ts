import NextAuth from "next-auth";

import { authOptions } from "~/server/auth/config";

const nextAuthHandler: unknown = NextAuth(authOptions);
const handler = nextAuthHandler as (req: Request) => Promise<Response>;

export { handler as GET, handler as POST };
