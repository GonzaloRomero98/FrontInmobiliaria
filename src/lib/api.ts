import axios from "axios";
import Cookies from "js-cookie";
import { refrescarCatalogo } from "@/app/acciones";

// El JWT lo pone la API en la cookie HttpOnly `auth_token` (este código no puede leerlo).
// `rol_usuario` sí la escribe el front: solo decide qué menú mostrar; la autorización real la hace la API.
// Cookie de sesión (sin expires): se borra al cerrar el navegador.
export const OPCIONES_COOKIE_SESION = {secure: true, sameSite: 'strict'} as const;

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    // En producción front y API comparten dominio; en desarrollo son puertos distintos y hace falta para enviar la cookie
    withCredentials: true,
    // Solo en el servidor (SSR): la API no aplica su límite por IP a estas lecturas (backend/src/limite-ssr.ts).
    // SSR_CLAVE no lleva NEXT_PUBLIC_, así que nunca llega al navegador.
    headers: typeof window === 'undefined' && process.env.SSR_CLAVE ? {'x-ssr-clave': process.env.SSR_CLAVE} : {},
});

// Un cambio en proyectos, modelos o características invalida el caché de las páginas públicas
const RUTAS_CATALOGO = /^\/(proyectos|modeloCasa|caracteristicas)\b/;
api.interceptors.response.use(async (respuesta)=>{
    const {method, url} = respuesta.config;
    if(typeof window !== 'undefined' && method !== 'get' && url && RUTAS_CATALOGO.test(url)){
        await refrescarCatalogo().catch(()=>{});
    }
    return respuesta;
});

// Sesión vencida o usuario desactivado: el backend responde 401 y se vuelve al login.
// Se excluye el propio login, donde 401 solo significa credenciales incorrectas.
api.interceptors.response.use(undefined, (error)=>{
    const enNavegador = typeof window !== 'undefined';
    const esLogin = error.config?.url?.includes('/auth/login');
    // La cookie del token (vencida o revocada) queda hasta el próximo login; sin rol, proxy.ts ya no deja entrar al panel
    if(enNavegador && error.response?.status === 401 && !esLogin && Cookies.get('rol_usuario')){
        Cookies.remove('rol_usuario');
        // Fuera de React no hay router; la recarga completa además limpia el estado de la sesión
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/login');
    }
    return Promise.reject(error);
});