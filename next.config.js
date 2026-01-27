/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side rendering enabled for API routes and database connections
  // output: 'export', // REMOVED - incompatible with API routes
  
  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
