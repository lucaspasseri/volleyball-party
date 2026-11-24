import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // Isolate browser test servers from the regular development server.
  distDir: process.env.RSVP_TEST_DIST_DIR || ".next",
};
export default config;
