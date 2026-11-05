import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:'inmobiliaria-modelos-3d-inacap2026'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'inmobiliaria-modelos-3d-inacap2026.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.adobe.com',
      },
    ]
  }
};

export default nextConfig;
