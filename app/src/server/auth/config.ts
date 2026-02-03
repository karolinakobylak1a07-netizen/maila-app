import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "~/server/db";
import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS";
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "STRATEGY" | "CONTENT" | "OPERATIONS";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
const providers = [
  DiscordProvider({
    clientId: env.DISCORD_CLIENT_ID ?? "DISCORD_CLIENT_ID_NOT_SET",
    clientSecret: env.DISCORD_CLIENT_SECRET ?? "DISCORD_CLIENT_SECRET_NOT_SET",
  }),
];

export const authOptions: NextAuthOptions = {
  providers,
  adapter: PrismaAdapter(db),
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role,
      },
    }),
  },
  session: {
    strategy: "database",
  },
};
