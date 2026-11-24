import { useSyncExternalStore } from "react";

const CONSULTA = '(prefers-reduced-motion: reduce)';

export const movimientoReducido = () => window.matchMedia(CONSULTA).matches;

// En el servidor se asume movimiento normal; el navegador corrige al hidratar y si la persona cambia el ajuste.
export function useMovimientoReducido() {
    return useSyncExternalStore(
        (avisar) => { const m = window.matchMedia(CONSULTA); m.addEventListener('change', avisar); return () => m.removeEventListener('change', avisar); },
        movimientoReducido,
        () => false,
    );
}
