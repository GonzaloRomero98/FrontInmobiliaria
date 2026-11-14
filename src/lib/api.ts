import axios from "axios";
import Cookies from "js-cookie";
import { refrescarCatalogo } from "@/app/acciones";

// El JWT va en la cookie HttpOnly auth_token, que este código no puede leer.
// rol_usuario solo decide qué menú mostrar. Los permisos los revisa la API.
export const OPCIONES_COOKIE_SESION = {secure: true, sameSite: 'strict'} as const;

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    // Necesario en desarrollo, donde el front y la API están en puertos distintos.
    withCredentials: true,
    // Solo en el servidor: la API no aplica el límite por IP a estas lecturas (backend/src/limite-ssr.ts).
    // SSR_CLAVE no lleva NEXT_PUBLIC_, así que nunca llega al navegador.
    headers: typeof window === 'undefined' && process.env.SSR_CLAVE ? {'x-ssr-clave': process.env.SSR_CLAVE} : {},
});

const RUTAS_CATALOGO = /^\/(proyectos|modeloCasa|caracteristicas)\b/;
api.interceptors.response.use(async (respuesta)=>{
    const {method, url} = respuesta.config;
    if(typeof window !== 'undefined' && method !== 'get' && url && RUTAS_CATALOGO.test(url)){
        await refrescarCatalogo().catch(()=>{});
    }
    return respuesta;
});

// Si la sesión venció la API responde 401 y se vuelve al login. En el propio login un 401 solo significa datos incorrectos.
api.interceptors.response.use(undefined, (error)=>{
    const enNavegador = typeof window !== 'undefined';
    const esLogin = error.config?.url?.includes('/auth/login');
    if(enNavegador && error.response?.status === 401 && !esLogin && Cookies.get('rol_usuario')){
        Cookies.remove('rol_usuario');
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- fuera de React no hay router, y recargar limpia el estado de la sesión
        window.location.assign('/login');
    }
    return Promise.reject(error);
});