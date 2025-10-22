/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix: Move serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    // Remove the deprecated serverComponentsExternalPackages
  },
  // Disable console logs in production builds using SWC
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // For Vercel deployment
  // Vercel handles Next.js automatically
};

export default nextConfig;
