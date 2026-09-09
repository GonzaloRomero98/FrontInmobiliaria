import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:'inmobiliaria-modelos-3d-inacap2026'
      }
    ]
  }
};

export default nextConfig;
