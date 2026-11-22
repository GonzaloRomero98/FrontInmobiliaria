'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useComparador } from "@/lib/comparador";
import { BOTON_PRIMARIO } from "@/lib/estilos";

const SECCIONES = [
    { href: '/#proyectos', texto: 'Proyectos' },
    { href: '/#beneficios', texto: 'Beneficios' },
    { href: '/#ubicacion', texto: 'Ubicación' },
];

function EnlaceComparar({ className, alClic }: { className: string; alClic?: () => void }) {
    const { ids } = useComparador();
    return (
        <Link href={ids.length ? `/comparar?ids=${ids.join(',')}` : '/comparar'} className={className} onClick={alClic}>
            Comparar
            {ids.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-acento text-white text-xs font-semibold tabular-nums">
                    <span className="sr-only">(</span>{ids.length}<span className="sr-only"> modelos)</span>
                </span>
            )}
        </Link>
    );
}

// Enlaces centrales del encabezado. En el celular se pliegan en un menú que se cierra al elegir una opción.
export default function NavegacionPrincipal() {
    const [abierto, setAbierto] = useState(false);
    const ruta = usePathname();
    const boton = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- al cambiar de página el menú se cierra
        setAbierto(false);
    }, [ruta]);

    // Con el menú abierto, Escape o un toque fuera lo cierran. Escape devuelve el foco al botón para no perder el lugar.
    useEffect(() => {
        if (!abierto) return;
        const tecla = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setAbierto(false);
            boton.current?.focus();
        };
        const fuera = (e: PointerEvent) => {
            const objetivo = e.target as Node;
            if (!menu.current?.contains(objetivo) && !boton.current?.contains(objetivo)) setAbierto(false);
        };
        document.addEventListener('keydown', tecla);
        document.addEventListener('pointerdown', fuera);
        return () => {
            document.removeEventListener('keydown', tecla);
            document.removeEventListener('pointerdown', fuera);
        };
    }, [abierto]);

    const enlaceEscritorio = "inline-flex items-center min-h-11 px-3 rounded-lg text-gray-700 hover:text-marca hover:bg-gray-50 transition-colors";
    const enlaceMovil = "flex items-center min-h-12 px-4 rounded-lg text-gray-800 hover:bg-gray-50";
    const cerrar = () => setAbierto(false);

    return (
        <>
            <div className="hidden md:flex flex-1 justify-center items-center gap-1 text-sm font-medium">
                {SECCIONES.map((s) => <Link key={s.href} href={s.href} className={enlaceEscritorio}>{s.texto}</Link>)}
                <EnlaceComparar className={enlaceEscritorio} />
            </div>

            <button ref={boton} type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} aria-controls="menu-movil"
                aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
                className="md:hidden order-last inline-flex items-center justify-center w-11 h-11 rounded-lg text-marca hover:bg-gray-50">
                {abierto ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>

            {abierto && (
                <div ref={menu} id="menu-movil" className="md:hidden absolute inset-x-0 top-full border-b bg-white shadow-md">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1 text-base font-medium">
                        {SECCIONES.map((s) => <Link key={s.href} href={s.href} className={enlaceMovil} onClick={cerrar}>{s.texto}</Link>)}
                        <EnlaceComparar className={enlaceMovil} alClic={cerrar} />
                        <Link href="/agendar" onClick={cerrar}
                            className={`${BOTON_PRIMARIO} mt-2 min-h-12`}>
                            Agendar visita
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
