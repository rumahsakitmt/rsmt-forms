import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@formepdf/core", "@formepdf/react"],
  async redirects() {
    return [
      {
        source: "/submissions/:path*",
        destination: "/admin/submissions/:path*",
        permanent: true,
      },
      { source: "/account", destination: "/admin/account", permanent: true },
    ];
  },
};

export default nextConfig;
