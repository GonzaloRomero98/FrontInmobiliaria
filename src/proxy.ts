import { NextRequest, NextResponse } from "next/server";

export function proxy(request:NextRequest){
    const token = request.cookies.get('auth_token')?.value;
    const rol = request.cookies.get('rol_usuario')?.value;

    const {pathname} = request.nextUrl;

    const rutaAdmin = pathname.startsWith('/admin');
    // /cuenta (cambiar la propia contraseña) admite los mismos roles que /secretario
    const rutaSecretario = pathname.startsWith('/secretario') || pathname.startsWith('/cuenta');

    if((rutaAdmin || rutaSecretario) && !token){
        return NextResponse.redirect(new URL('/login',request.url));
    }

    // El SECRETARIO solo gestiona solicitudes: se le lleva a su bandeja en vez de al login
    if(rutaAdmin && rol === 'SECRETARIO'){
        return NextResponse.redirect(new URL('/secretario', request.url));
    }

    if(rutaAdmin && rol !== 'ADMIN'){
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if(rutaSecretario && rol !== 'ADMIN' && rol !== 'SECRETARIO'){
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
 }

 export const config = {
    matcher:['/admin/:path*', '/secretario/:path*', '/cuenta/:path*']
 }