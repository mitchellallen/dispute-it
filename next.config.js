/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keys are now injected securely by Firebase App Hosting
  images: {
    domains: ['maps.googleapis.com'],
  },
};

module.exports = nextConfig;