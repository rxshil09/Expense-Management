/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // App directory is now stable in Next.js 14
  },
  transpilePackages: ['@expense-mgmt/shared'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;