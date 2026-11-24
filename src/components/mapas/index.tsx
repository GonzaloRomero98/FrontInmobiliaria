'use client'

import dynamic from 'next/dynamic';
import { ESQUELETO } from '@/components/Esqueleto';

// Leaflet necesita window, por eso los mapas se cargan solo en el navegador.
function Cargando({ altura }: { altura: number }) {
    return (
        <div role="status" style={{ height: altura }} className={`${ESQUELETO} w-full rounded-xl`}>
            <span className="sr-only">Cargando mapa…</span>
        </div>
    );
}

export const MapaProyectos = dynamic(() => import('./MapaLeaflet').then((m) => m.MapaProyectosLeaflet), {
    ssr: false,
    loading: () => <Cargando altura={420} />,
});

export const MapaEntorno = dynamic(() => import('./MapaLeaflet').then((m) => m.MapaEntornoLeaflet), {
    ssr: false,
    loading: () => <Cargando altura={420} />,
});

export const SelectorUbicacion = dynamic(() => import('./MapaLeaflet').then((m) => m.SelectorUbicacionLeaflet), {
    ssr: false,
    loading: () => <Cargando altura={320} />,
});

export type { PuntoProyecto, PuntoSala } from './MapaLeaflet';
