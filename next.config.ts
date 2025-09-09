import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions for file handling
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Configure file upload limits
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Adjust based on your file size needs
    },
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
};

export default nextConfig;
