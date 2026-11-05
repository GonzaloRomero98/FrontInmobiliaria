export const NOMBRE_SITIO = 'Inmocap';
export const DESCRIPCION_SITIO = 'Proyectos inmobiliarios en Chile con recorridos 3D, realidad aumentada y toda la información para decidir.';
export const URL_SITIO = (process.env.NEXT_PUBLIC_PAGE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const WHATSAPP_NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '').replace(/\D/g, '');

// Máximo de modelos en el comparador
export const MAXIMO_COMPARAR = 3;
