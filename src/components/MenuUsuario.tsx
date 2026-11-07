'use client'

import { ChevronDown } from "lucide-react";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AvatarUsuario from "@/components/AvatarUsuario";
import BotonDesconectar from "@/components/BotonDesconectar";
import { EVENTO_PERFIL_ACTUALIZADO, getMiPerfil, Usuario } from "@/services/usuario.service";

const ESTILO_OPCION = "block w-full text-left px-4 py-2 text-sm hover:bg-gray-50";

// Sin sesión muestra "Ingresar"; con sesión, la foto y el nombre con un menú (panel, perfil, cerrar sesión).
// La cookie se lee en el navegador y no en el servidor, para no quitarle la caché (ISR) a las páginas públicas.
export default function MenuUsuario(){
    const pathname = usePathname();
    const [token, setToken] = useState<string | null>(null);
    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [abierto, setAbierto] = useState(false);
    const contenedor = useRef<HTMLDivElement>(null);
    const boton = useRef<HTMLButtonElement>(null);

    // Se revisa en cada navegación: así el menú aparece tras el login y desaparece al cerrar sesión
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- la cookie solo existe en el navegador
        setToken(Cookies.get('auth_token') ?? null);
        setAbierto(false);
    }, [pathname]);

    useEffect(() => {
        if(!token){
            // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia el perfil al cerrar sesión
            setPerfil(null);
            return;
        }
        const cargar = () => { getMiPerfil().then(setPerfil).catch(() => setPerfil(null)); };
        cargar();
        window.addEventListener(EVENTO_PERFIL_ACTUALIZADO, cargar);
        return () => window.removeEventListener(EVENTO_PERFIL_ACTUALIZADO, cargar);
    }, [token]);

    // Cierra con clic afuera o con Escape (devolviendo el foco al botón)
    useEffect(() => {
        if(!abierto) return;
        const alClic = (e:MouseEvent) => {
            if(!contenedor.current?.contains(e.target as Node)) setAbierto(false);
        };
        const alTecla = (e:KeyboardEvent) => {
            if(e.key === 'Escape'){
                setAbierto(false);
                boton.current?.focus();
            }
        };
        document.addEventListener('mousedown', alClic);
        document.addEventListener('keydown', alTecla);
        return () => {
            document.removeEventListener('mousedown', alClic);
            document.removeEventListener('keydown', alTecla);
        };
    }, [abierto]);

    if(!token){
        return <Link href="/login" className="text-gray-500 hover:underline">Ingresar</Link>;
    }

    const nombre = perfil?.nombre ?? 'Mi cuenta';
    const rol = perfil?.rol.nombre ?? Cookies.get('rol_usuario');

    return (
        <div ref={contenedor} className="relative">
            <button ref={boton} type="button" onClick={() => setAbierto((a) => !a)}
                aria-expanded={abierto} aria-controls="menu-usuario" aria-label={`Menú de ${nombre}`}
                className="flex items-center gap-2 rounded-full hover:bg-gray-50 p-1 pr-2">
                <AvatarUsuario nombre={nombre} fotoUrl={perfil?.fotoUrl} />
                <span className="hidden sm:inline max-w-36 truncate">{nombre}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" aria-hidden />
            </button>

            {abierto && (
                <div id="menu-usuario" className="absolute right-0 mt-2 w-60 bg-white border rounded-lg shadow-lg py-2 z-50">
                    {perfil && (
                        <div className="px-4 pb-2 mb-1 border-b">
                            <p className="font-medium truncate">{perfil.nombre}</p>
                            <p className="text-xs text-gray-500 truncate">{perfil.correo}</p>
                        </div>
                    )}
                    <Link href={rol === 'ADMIN' ? '/admin' : '/secretario'} className={ESTILO_OPCION}>Mi panel</Link>
                    <Link href="/cuenta" className={ESTILO_OPCION}>Mi perfil</Link>
                    <BotonDesconectar className={`${ESTILO_OPCION} text-red-600`} />
                </div>
            )}
        </div>
    );
}
