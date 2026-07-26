import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @repo/ui ships TypeScript source rather than a build output.
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
