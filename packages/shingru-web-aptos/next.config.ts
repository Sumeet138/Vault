import type { NextConfig } from "next";
import path from "path";

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
  // Resolve modules from parent directory (for workspace/monorepo setup)
  webpack: (config, { isServer }) => {
    // Add parent node_modules to resolve paths
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, "node_modules"),
      path.resolve(__dirname, "../../node_modules"),
    ];
    
    // Existing webpack config for got module
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        got: path.resolve(__dirname, "src/lib/empty.js"),
      };
    }
    if (Array.isArray(config.externals)) {
      config.externals.push("pino-pretty", "lokijs", "encoding");
    } else if (config.externals) {
      config.externals = [config.externals, "pino-pretty", "lokijs", "encoding"];
    } else {
      config.externals = ["pino-pretty", "lokijs", "encoding"];
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
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
        hostname: "**.vault.me",
      },
    ],
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
