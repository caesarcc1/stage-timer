/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Evita double-mounting do socket em dev
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
