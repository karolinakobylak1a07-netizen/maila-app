/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Only check types during development, skip in production build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during production build
    ignoreDuringBuilds: true,
  },
};

export default config;
