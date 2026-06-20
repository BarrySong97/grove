import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js doesn't pick up a stray lockfile
  // from a parent directory when inferring the Turbopack root.
  turbopack: {
    root: path.join(import.meta.dirname, "..", ".."),
  },
  // The shared @grove/ui package ships TypeScript source — transpile it here.
  transpilePackages: ["@grove/ui"],
};

export default nextConfig;
