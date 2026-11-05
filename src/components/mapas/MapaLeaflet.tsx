'use client'

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { CATEGORIAS_ENTORNO, LugarCercano } from '@/types/entorno';
import { formatearDistancia } from '@/lib/formato';

export interface PuntoProyecto {
    id: string;
    nombre: string;
    comuna: string;
    latitud: number;
    longitud: number;
}

const CENTRO_CHILE: [number, number] = [-33.45, -70.66];
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const TESELAS = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Pin dibujado con CSS (evita las imágenes de marcador de Leaflet, que se rompen con bundlers)
const pin = L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;background:#111827;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
});

function AjustarVista({ puntos }: { puntos: [number, number][] }) {
    const mapa = useMap();
    useEffect(() => {
        if (puntos.length === 1) mapa.setView(puntos[0], 14);
        if (puntos.length > 1) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 14 });
    }, [mapa, puntos]);
    return null;
}

const estiloMapa = (altura: number) => ({ height: altura, width: '100%', borderRadius: 12, zIndex: 0 });

export function MapaProyectosLeaflet({ proyectos, altura = 420 }: { proyectos: PuntoProyecto[]; altura?: number }) {
    const puntos = useMemo(() => proyectos.map((p) => [p.latitud, p.longitud] as [number, number]), [proyectos]);
    return (
        <MapContainer center={CENTRO_CHILE} zoom={5} scrollWheelZoom={false} style={estiloMapa(altura)}>
            <TileLayer attribution={ATRIBUCION} url={TESELAS} />
            <AjustarVista puntos={puntos} />
            {proyectos.map((p) => (
                <Marker key={p.id} position={[p.latitud, p.longitud]} icon={pin}>
                    <Popup>
                        <strong>{p.nombre}</strong><br />{p.comuna}<br />
                        <Link href={`/proyectos/${p.id}`}>Ver proyecto</Link>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export function MapaEntornoLeaflet({ latitud, longitud, nombre, lugares, radio }: {
    latitud: number; longitud: number; nombre: string; lugares: LugarCercano[]; radio: number;
}) {
    return (
        <MapContainer center={[latitud, longitud]} zoom={15} scrollWheelZoom={false} style={estiloMapa(420)}>
            <TileLayer attribution={ATRIBUCION} url={TESELAS} />
            <Circle center={[latitud, longitud]} radius={radio} pathOptions={{ color: '#111827', weight: 1, fillOpacity: 0.04 }} />
            {lugares.map((l) => {
                const categoria = CATEGORIAS_ENTORNO[l.categoria];
                return (
                    <CircleMarker key={l.id} center={[l.latitud, l.longitud]} radius={6}
                        pathOptions={{ color: '#fff', weight: 1.5, fillColor: categoria.color, fillOpacity: 0.95 }}>
                        <Tooltip>{l.nombre ?? categoria.sinNombre} · {formatearDistancia(l.distancia)}</Tooltip>
                    </CircleMarker>
                );
            })}
            <Marker position={[latitud, longitud]} icon={pin}>
                <Tooltip permanent direction="top" offset={[0, -24]}>{nombre}</Tooltip>
            </Marker>
        </MapContainer>
    );
}

function CapturarClick({ onCambio }: { onCambio: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onCambio(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        },
    });
    return null;
}

export function SelectorUbicacionLeaflet({ latitud, longitud, onCambio }: {
    latitud: number | null; longitud: number | null; onCambio: (lat: number, lng: number) => void;
}) {
    const posicion: [number, number] | null = latitud !== null && longitud !== null ? [latitud, longitud] : null;
    return (
        <MapContainer center={posicion ?? CENTRO_CHILE} zoom={posicion ? 15 : 5} style={estiloMapa(320)}>
            <TileLayer attribution={ATRIBUCION} url={TESELAS} />
            <CapturarClick onCambio={onCambio} />
            {posicion && <Marker position={posicion} icon={pin} />}
        </MapContainer>
    );
}
