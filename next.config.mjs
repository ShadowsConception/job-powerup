// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you had this:
  // experimental: {
  //   serverComponentsExternalPackages: ["jsdom", "@mozilla/readability"],
  // },
  // Replace it with:
  serverExternalPackages: ["jsdom", "@mozilla/readability"],

  // keep any other settings you already had:
  experimental: {
    // (anything else you’re using can stay here)
  },
};

export default nextConfig;
