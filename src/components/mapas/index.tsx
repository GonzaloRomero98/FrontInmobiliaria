'use client'

import dynamic from 'next/dynamic';

// Leaflet necesita `window`: los mapas se cargan solo en el navegador
function Cargando({ altura }: { altura: number }) {
    return <div style={{ height: altura }} className="w-full rounded-xl bg-gray-100 animate-pulse" aria-label="Cargando mapa" />;
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
