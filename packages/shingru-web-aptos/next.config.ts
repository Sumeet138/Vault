import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    viewTransition: true,
  },
  async headers() {
    const baseHeaders = [
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "usc1.contabostorage.com",
      },
      {
        protocol: "https",
        hostname: "**.pivy.me",
      },
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: "./src/lib/empty.js",
      net: "./src/lib/empty.js",
      tls: "./src/lib/empty.js",
    },
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
};

export default nextConfig;
