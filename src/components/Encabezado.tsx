import Image from "next/image";
import Link from "next/link";
import { NOMBRE_SITIO } from "@/lib/sitio";
import MenuUsuario from "@/components/MenuUsuario";
import NavegacionPrincipal from "@/components/NavegacionPrincipal";
import { BOTON_PRIMARIO } from "@/lib/estilos";

export default function Encabezado() {
    return (
        <header className="relative z-40 border-b bg-white">
            <nav className="relative max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
                <Link href="/" className="shrink-0 mr-auto md:mr-0">
                    <Image src="/logo-inmocap.png" alt={NOMBRE_SITIO} width={562} height={144} className="h-10 w-auto" loading="eager" />
                </Link>
                <NavegacionPrincipal />
                <div className="flex items-center gap-3 text-sm font-medium">
                    <MenuUsuario />
                    {/* En /agendar se elige proyecto y modelo, porque cada solicitud va ligada a un modelo. */}
                    <Link href="/agendar"
                        className={`${BOTON_PRIMARIO} max-sm:hidden min-h-11 px-5`}>
                        Agendar visita
                    </Link>
                </div>
            </nav>
        </header>
    );
}
