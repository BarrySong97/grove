import path from "node:path";
import type { NextConfig } from "next";

// Set BUILD_STATIC=1 to produce a fully static export in `out/` for
// Cloudflare Pages (`wrangler pages deploy`). Left unset on Vercel, where
// the default server build keeps image optimization and SSR available.
const isStatic = process.env.BUILD_STATIC === "1";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js doesn't pick up a stray lockfile
  // from a parent directory when inferring the Turbopack root.
  turbopack: {
    root: path.join(import.meta.dirname, "..", ".."),
  },
  // The shared @grove/ui package ships TypeScript source — transpile it here.
  transpilePackages: ["@grove/ui"],
  // Static export: emit plain HTML/assets and disable the Image Optimization
  // API (no server to run it). Only applied for the Cloudflare build.
  ...(isStatic ? { output: "export" as const, images: { unoptimized: true } } : {}),
};

export default nextConfig;
