import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Spec 04, Decision 1: the lesson starts at its first step, so the home and
  // header links to /gravitation keep working.
  redirects: async () => [
    {
      source: "/gravitation",
      destination: "/gravitation/falling",
      permanent: false,
    },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
