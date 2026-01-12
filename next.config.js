/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for static export
  output: 'export',

  // Recommended for Azure static hosting
  trailingSlash: true,

  // Prevent Next Image optimization issues in static export
  images: {
    unoptimized: true,
  },

  // Disable server-only features explicitly (safety)
  reactStrictMode: true,
};

module.exports = nextConfig;
