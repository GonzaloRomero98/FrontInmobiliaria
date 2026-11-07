import axios from "axios";
import Cookies from "js-cookie";

// Cookies de sesión (sin expires): se borran al cerrar el navegador; el JWT vence a las 8 h
export const OPCIONES_COOKIE_SESION = {secure: true, sameSite: 'strict'} as const;

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});


api.interceptors.request.use((config)=>{
    const token  = Cookies.get('auth_token');
    if(token){
        config.headers.Authorization=`Bearer ${token}`
    }

    return config;
});

// Sesión vencida o usuario desactivado: el backend responde 401 y se vuelve al login.
// Se excluye el propio login, donde 401 solo significa credenciales incorrectas.
api.interceptors.response.use(undefined, (error)=>{
    const enNavegador = typeof window !== 'undefined';
    const esLogin = error.config?.url?.includes('/auth/login');
    if(enNavegador && error.response?.status === 401 && !esLogin && Cookies.get('auth_token')){
        Cookies.remove('auth_token');
        Cookies.remove('rol_usuario');
        // Fuera de React no hay router; la recarga completa además limpia el estado de la sesión
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign('/login');
    }
    return Promise.reject(error);
});