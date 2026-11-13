'use client'

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { logout } from "@/services/auth.service";

export default function BotonDesconectar({className = "text-sm text-gray-500 hover:text-marca"}:{className?:string}){
    const router = useRouter();

    async function cerrarSesion(){
        // La cookie del token es HttpOnly: solo la API puede borrarla. Si la API no responde, igual se sale del panel.
        await logout().catch(() => {});
        Cookies.remove('rol_usuario');
        router.push('/login');
    }

    return(
        <button type="button" onClick={cerrarSesion} className={className}>Cerrar sesión</button>
    );
}
