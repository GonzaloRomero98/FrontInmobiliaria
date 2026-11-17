import type { NextConfig } from "next";

const desarrollo = process.env.NODE_ENV === 'development';
const origenApi = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : '';
// Bucket actual (AWS_S3_BUCKET / AWS_REGION del backend); si cambia el bucket hay que cambiar esta línea.
// Va el host exacto y no *.amazonaws.com, que permitiría enviar datos al bucket de cualquier persona.
const HOST_S3 = 'inmobiliaria-media-s3.s3.us-east-2.amazonaws.com';

// Content Security Policy (ISO 27001 A.8.26): limita desde dónde se cargan scripts, imágenes y conexiones,
// para que un XSS no pueda traer código externo ni enviar el token de sesión a otro dominio.
// 'unsafe-inline' en scripts lo exige Next sin nonces; los nonces harían dinámicas todas las páginas (sin ISR).
const csp = [
  "default-src 'self'",
  // gstatic: decodificadores Draco/Basis de <model-viewer>; wasm-unsafe-eval para su WebAssembly
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.gstatic.com${desarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // S3 (fotos y modelos sin optimizar) y teselas de OpenStreetMap del mapa
  `img-src 'self' data: blob: https://${HOST_S3} https://*.tile.openstreetmap.org`,
  "font-src 'self' data:",
  // API, subidas a S3 con URL firmada, modelos 3D y decodificadores; en desarrollo, el websocket de recarga
  `connect-src 'self' ${origenApi} https://${HOST_S3} https://www.gstatic.com${desarrollo ? ' ws:' : ''}`,
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(origenApi.startsWith('https:') ? ['upgrade-insecure-requests'] : []),
].join('; ');

const nextConfig: NextConfig = {
  // Se quita la cabecera X-Powered-By para no anunciar qué framework usa el sitio.
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
  images:{
    // Solo el bucket actual. Se revisó en la BD (2026-11-16) que todas las URLs guardadas apuntan a él.
    remotePatterns:[
      { protocol: 'https', hostname: HOST_S3, pathname: '/**' },
    ]
  }
};

export default nextConfig;
