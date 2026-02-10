import { getServerSession } from "next-auth";
import { authOptions } from "./config";

const DEV_BYPASS_AUTH_ENABLED =
  (process.env.NODE_ENV === "development" &&
    process.env.DEV_BYPASS_AUTH !== "false") ||
  process.env.BYPASS_AUTH === "true";
const DEV_USER_ID = process.env.DEV_AUTH_USER_ID ?? "dev-local-session-user";
const DEV_USER_NAME = process.env.DEV_AUTH_USER_NAME ?? "Local Developer";
const DEV_USER_EMAIL = process.env.DEV_AUTH_USER_EMAIL ?? "dev-local@example.com";

export const getServerAuthSession = async () => {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user) {
      return session;
    }
  } catch {
    // Ignore session lookup errors in dev fallback mode.
  }

  if (!DEV_BYPASS_AUTH_ENABLED) {
    return null;
  }

  return {
    user: {
      id: DEV_USER_ID,
      name: DEV_USER_NAME,
      email: DEV_USER_EMAIL,
      image: null,
      role: "OWNER",
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
};
