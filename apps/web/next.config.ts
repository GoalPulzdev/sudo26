import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@sudoku-2026/core"],
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

export default config;
