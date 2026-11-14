'use client'

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MAXIMO_COMPARAR } from "./sitio";

const CLAVE = 'inmocap:comparar';
const EVENTO = 'inmocap:comparar-cambio';
export { MAXIMO_COMPARAR };

function leer(): string {
    try {
        return localStorage.getItem(CLAVE) ?? '[]';
    } catch {
        return '[]';
    }
}

function escribir(ids: string[]) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(ids));
    } catch {
        // En modo privado puede no haber almacenamiento; la selección dura solo mientras la página esté abierta.
    }
    window.dispatchEvent(new Event(EVENTO));
}

function suscribir(aviso: () => void) {
    window.addEventListener('storage', aviso);
    window.addEventListener(EVENTO, aviso);
    return () => {
        window.removeEventListener('storage', aviso);
        window.removeEventListener(EVENTO, aviso);
    };
}

function parsear(crudo: string): string[] {
    try {
        const valor = JSON.parse(crudo);
        return Array.isArray(valor) ? valor.filter((id) => typeof id === 'string').slice(0, MAXIMO_COMPARAR) : [];
    } catch {
        return [];
    }
}

// Modelos elegidos para comparar. Se guardan en el navegador y se sincronizan entre pestañas.
export function useComparador() {
    const crudo = useSyncExternalStore(suscribir, leer, () => '[]');
    const ids = useMemo(() => parsear(crudo), [crudo]);

    const alternar = useCallback((id: string) => {
        const actuales = parsear(leer());
        if (actuales.includes(id)) {
            escribir(actuales.filter((x) => x !== id));
        } else if (actuales.length < MAXIMO_COMPARAR) {
            escribir([...actuales, id]);
        }
    }, []);

    const reemplazar = useCallback((nuevos: string[]) => escribir(nuevos.slice(0, MAXIMO_COMPARAR)), []);

    return { ids, alternar, reemplazar, lleno: ids.length >= MAXIMO_COMPARAR };
}
