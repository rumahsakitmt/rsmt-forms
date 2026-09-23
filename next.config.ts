import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@formepdf/core", "@formepdf/react"],
  async redirects() {
    return [
      { source: "/account", destination: "/admin/account", permanent: true },
    ];
  },
};

export default nextConfig;
