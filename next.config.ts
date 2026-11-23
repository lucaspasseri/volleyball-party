import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // Isolate the mocked-integration server from an already running local preview.
  distDir: process.env.RSVP_TEST_DIST_DIR || ".next",
};
export default config;
