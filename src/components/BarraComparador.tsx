'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAXIMO_COMPARAR, useComparador } from "@/lib/comparador";

// Barra fija inferior con la selección de modelos para comparar
export default function BarraComparador() {
    const { ids, reemplazar } = useComparador();
    const ruta = usePathname();

    if (ids.length === 0 || ruta.startsWith('/comparar') || ruta.startsWith('/admin') || ruta.startsWith('/secretario')) {
        return null;
    }

    return (
        <div className="fixed bottom-4 inset-x-0 z-50 px-4 pointer-events-none">
            <div className="pointer-events-auto max-w-md mx-auto flex items-center justify-between gap-3 bg-marca text-white rounded-full pl-5 pr-2 py-2 shadow-xl">
                <span className="text-sm">
                    {ids.length} de {MAXIMO_COMPARAR} modelos para comparar
                </span>
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => reemplazar([])} className="text-xs text-gray-300 hover:text-white px-2">
                        Limpiar
                    </button>
                    <Link
                        href={`/comparar?ids=${ids.join(',')}`}
                        className={`text-sm font-medium rounded-full px-4 py-1.5 ${ids.length < 2 ? 'bg-gray-600 pointer-events-none' : 'bg-white text-marca'}`}
                        aria-disabled={ids.length < 2}
                    >
                        Comparar
                    </Link>
                </div>
            </div>
        </div>
    );
}
