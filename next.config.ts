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
      // Bucket actual (AWS_S3_BUCKET / AWS_REGION del backend); si cambia el bucket hay que cambiar esta línea
      { protocol: 'https', hostname: 'inmobiliaria-media-s3.s3.us-east-2.amazonaws.com', pathname: '/**' },
    ]
  }
};

export default nextConfig;
