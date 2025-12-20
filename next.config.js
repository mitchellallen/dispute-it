/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This instructs Next.js to pull the values from the environment (The Vault)
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_RENTSCAST_API_KEY: process.env.NEXT_PUBLIC_RENTSCAST_API_KEY,
    HASDATA_API_KEY: process.env.HASDATA_API_KEY,
  },
  images: {
    domains: ['maps.googleapis.com'],
  },
};

module.exports = nextConfig;