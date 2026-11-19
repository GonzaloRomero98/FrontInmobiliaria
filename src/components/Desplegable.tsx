'use client'

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type OpcionDesplegable = { valor: string; texto: string };

// Reemplaza al <select> nativo en el sitio público, cuya lista desplegada no se puede estilizar.
// Sigue el patrón "select-only combobox" de ARIA: el foco queda en el botón y las flechas mueven la opción activa.
export default function Desplegable({ etiqueta, valor, opciones, onChange, disabled, className = '' }: {
    etiqueta: string;
    valor: string;
    opciones: OpcionDesplegable[];
    onChange: (valor: string) => void;
    disabled?: boolean;
    className?: string;
}) {
    const id = useId();
    const raiz = useRef<HTMLDivElement>(null);
    const [abierto, setAbierto] = useState(false);
    const [activo, setActivo] = useState(0);
    const elegida = opciones.find((o) => o.valor === valor) ?? opciones[0];

    // Safari no enfoca el botón al hacer clic, así que el blur no basta para cerrar al tocar fuera.
    useEffect(() => {
        if (!abierto) return;
        const fuera = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierto(false); };
        document.addEventListener('pointerdown', fuera);
        return () => document.removeEventListener('pointerdown', fuera);
    }, [abierto]);

    useEffect(() => {
        if (abierto) document.getElementById(`${id}-${activo}`)?.scrollIntoView({ block: 'nearest' });
    }, [abierto, activo, id]);

    function abrir() {
        setActivo(Math.max(0, opciones.findIndex((o) => o.valor === valor)));
        setAbierto(true);
    }

    function elegir(i: number) {
        onChange(opciones[i].valor);
        setAbierto(false);
    }

    function teclado(e: React.KeyboardEvent) {
        if (!abierto) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') { e.preventDefault(); abrir(); }
            return;
        }
        const destino = ({ ArrowDown: activo + 1, ArrowUp: activo - 1, Home: 0, End: opciones.length - 1 } as Record<string, number>)[e.key];
        if (destino !== undefined) { e.preventDefault(); setActivo(Math.min(opciones.length - 1, Math.max(0, destino))); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(activo); }
        else if (e.key === 'Escape') { e.preventDefault(); setAbierto(false); }
    }

    return (
        <div ref={raiz} className="relative w-full">
            {/* El espacio activa el botón al soltarse; se cancela porque ya se manejó al presionarse. */}
            <button type="button" role="combobox" aria-label={etiqueta} aria-haspopup="listbox" aria-expanded={abierto}
                aria-controls={`${id}-lista`} aria-activedescendant={abierto ? `${id}-${activo}` : undefined}
                disabled={disabled} onClick={() => (abierto ? setAbierto(false) : abrir())} onKeyDown={teclado}
                onKeyUp={(e) => { if (e.key === ' ') e.preventDefault(); }} onBlur={() => setAbierto(false)}
                className={`flex w-full items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
                <span className="truncate">{elegida?.texto}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-gray-600 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {abierto && (
                // mousedown cancelado: el foco se queda en el botón. click cancelado: el <label> que envuelve no reabre la lista.
                <ul id={`${id}-lista`} role="listbox" aria-label={etiqueta} onMouseDown={(e) => e.preventDefault()}
                    className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl bg-white p-1.5 shadow-lg shadow-gray-900/10 ring-1 ring-gray-200/70">
                    {opciones.map((o, i) => (
                        <li key={o.valor} id={`${id}-${i}`} role="option" aria-selected={o.valor === valor}
                            onPointerEnter={() => setActivo(i)} onClick={(e) => { e.preventDefault(); elegir(i); }}
                            className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-base ${i === activo ? 'bg-gray-100' : ''} ${o.valor === valor ? 'font-semibold text-marca' : 'font-normal text-gray-700'}`}>
                            {o.texto}
                            {o.valor === valor && <Check className="w-4 h-4 shrink-0 text-acento" aria-hidden="true" />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
