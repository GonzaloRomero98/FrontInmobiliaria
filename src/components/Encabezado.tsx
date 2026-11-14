import Image from "next/image";
import Link from "next/link";
import { NOMBRE_SITIO } from "@/lib/sitio";
import MenuUsuario from "@/components/MenuUsuario";

// min-h-11 deja los enlaces de 44 px de alto para tocarlos con el dedo.
const ENLACE = "inline-flex items-center min-h-11 hover:underline";

export default function Encabezado() {
    return (
        <header className="border-b bg-white">
            <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="shrink-0">
                    <Image src="/logo-inmocap.png" alt={NOMBRE_SITIO} width={562} height={144} className="h-10 w-auto" priority />
                </Link>
                <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
                    <Link href="/buscar" className={ENLACE}>Buscar</Link>
                    <Link href="/comparar" className={ENLACE}>Comparar</Link>
                    <MenuUsuario />
                </div>
            </nav>
        </header>
    );
}
