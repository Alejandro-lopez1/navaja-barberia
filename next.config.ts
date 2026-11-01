import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis"],
  poweredByHeader: false,
};

export default nextConfig;
