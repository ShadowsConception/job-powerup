/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["jsdom", "@mozilla/readability"],

  // Skip ESLint during `next build` so deploys don’t fail on style rules
  eslint: { ignoreDuringBuilds: true },

  // (Optional) if you ever hit strict TS errors on Vercel, uncomment below
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
