'use client'

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function BotonDesconectar({className = "text-sm text-gray-500 hover:text-marca"}:{className?:string}){
    const router = useRouter();

    function cerrarSesion(){
        Cookies.remove('auth_token');
        Cookies.remove('rol_usuario');
        router.push('/login');
    }

    return(
        <button type="button" onClick={cerrarSesion} className={className}>Cerrar sesión</button>
    );
}
