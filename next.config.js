/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side rendering enabled for API routes and database connections
  // output: 'export', // REMOVED - incompatible with API routes
  
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
