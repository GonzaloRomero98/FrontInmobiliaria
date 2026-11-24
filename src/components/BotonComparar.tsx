'use client'

import { MAXIMO_COMPARAR, useComparador } from "@/lib/comparador";
import { avisar } from "@/components/Dialogos";
import { BOTON_SECUNDARIO } from "@/lib/estilos";

interface BotonCompararProps {
    idModelo: string;
    variante?: 'flotante' | 'completo';
}

export default function BotonComparar({ idModelo, variante = 'flotante' }: BotonCompararProps) {
    const { ids, alternar, lleno } = useComparador();
    const seleccionado = ids.includes(idModelo);
    const deshabilitado = !seleccionado && lleno;
    const texto = seleccionado ? 'En comparación' : 'Comparar';

    const estilos = variante === 'flotante'
        ? `absolute top-3 right-3 z-10 text-sm min-h-11 px-3 rounded-full shadow ${seleccionado ? 'bg-marca text-white' : 'bg-white/95 text-gray-900'}`
        : `w-full min-h-12 px-4 ${seleccionado ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-marca bg-marca text-white font-medium' : BOTON_SECUNDARIO}`;

    return (
        <button
            type="button"
            // aria-disabled en vez de disabled: el botón sigue recibiendo el toque para explicar por qué no agrega.
            onClick={() => deshabilitado ? avisar(`Puedes comparar hasta ${MAXIMO_COMPARAR} modelos. Quita uno para agregar otro.`) : alternar(idModelo)}
            aria-disabled={deshabilitado}
            aria-pressed={seleccionado}
            className={`${estilos} aria-disabled:opacity-50 aria-disabled:cursor-not-allowed transition-colors`}
        >
            {seleccionado ? '✓ ' : '+ '}{texto}
        </button>
    );
}
