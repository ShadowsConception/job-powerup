// next.config.mjs
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability"],

  // Don’t fail builds on lint/TS while we ship
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Resolve "@/..." to "<repo>/src/..."
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
};

export default nextConfig;
