/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This forces the keys to be available to the app
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'AIzaSyDBjP46Cq1kordOLCACwkimWQqWoKhJci1E',
    NEXT_PUBLIC_GEMINI_API_KEY: 'AIzaSyBk5TFKiq0j1iRN7svynIG6QrfLF4-fnBY',
  },
  images: {
    domains: ['maps.googleapis.com'],
  },
};

module.exports = nextConfig;