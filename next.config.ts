import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/tools/secureye-expo',
        destination: '/secureye-expo',
        permanent: true,
      },
      {
        source: '/tools/hyperlink-generator',
        destination: '/hyperlink-generator',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
