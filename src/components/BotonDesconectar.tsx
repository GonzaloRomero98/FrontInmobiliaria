'use client'

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function BotonDesconectar(){
    const router = useRouter();

    function cerrarSesion(){
        Cookies.remove('auth_token');
        Cookies.remove('rol_usuario');
        router.push('/login');
    }

    return(
        <button onClick={cerrarSesion} className="text-sm text-gray-500 hover:text-marca"> Cerrar Sesion</button>
    );
}