/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
      // Railway-generated domains, so admin-uploaded product/evidence
      // images served from the backend's /uploads path can render.
      { protocol: "https", hostname: "*.up.railway.app" },
      { protocol: "https", hostname: "*.railway.app" },
    ],
  },
};

export default nextConfig;
