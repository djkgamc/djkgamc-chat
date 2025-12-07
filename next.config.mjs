/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN || '*.replit.dev',
  ].filter(Boolean)
};

export default nextConfig;
