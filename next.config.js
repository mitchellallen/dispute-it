/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We do NOT manually map env vars here.
  // Next.js automatically picks up NEXT_PUBLIC_ variables from the environment.
  images: {
    domains: ['maps.googleapis.com'],
  },
};

module.exports = nextConfig;