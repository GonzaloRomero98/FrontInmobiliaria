'use client'

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { CATEGORIAS_ENTORNO, LugarCercano } from '@/types/entorno';
import { formatearDistancia } from '@/lib/formato';
import { htmlSimbolo, TipoPunto } from './simbolos';

export interface PuntoProyecto {
    id: string;
    nombre: string;
    comuna: string;
    latitud: number;
    longitud: number;
    // Qué vende el proyecto (null = sin modelos publicados), p. ej. "2 modelos de casa" y "Desde 2.000 UF"
    tipo?: Exclude<TipoPunto, 'SALA'> | null;
    resumen?: string;
    desde?: string | null;
}

export interface PuntoSala {
    idProyecto: string;
    proyecto: string;
    direccion: string;
    horario: string | null;
    telefono: string | null;
    comoLlegar: string;
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

const iconos = new Map<string, L.DivIcon>();
function icono(tipo: TipoPunto | null): L.DivIcon {
    const clave = tipo ?? 'NINGUNO';
    if (!iconos.has(clave)) {
        iconos.set(clave, L.divIcon({
            className: '', html: htmlSimbolo(tipo),
            iconSize: [26, 26], iconAnchor: tipo === 'SALA' ? [13, 13] : [13, 26], popupAnchor: [0, tipo === 'SALA' ? -13 : -26],
        }));
    }
    return iconos.get(clave)!;
}

function AjustarVista({ puntos }: { puntos: [number, number][] }) {
    const mapa = useMap();
    useEffect(() => {
        if (puntos.length === 1) mapa.setView(puntos[0], 14);
        if (puntos.length > 1) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 14 });
    }, [mapa, puntos]);
    return null;
}

const estiloMapa = (altura: number) => ({ height: altura, width: '100%', borderRadius: 12, zIndex: 0 });

export function MapaProyectosLeaflet({ proyectos, salas = [], altura = 420 }: { proyectos: PuntoProyecto[]; salas?: PuntoSala[]; altura?: number }) {
    const puntos = useMemo(() => [...proyectos, ...salas].map((p) => [p.latitud, p.longitud] as [number, number]), [proyectos, salas]);
    return (
        <MapContainer center={CENTRO_CHILE} zoom={5} scrollWheelZoom={false} style={estiloMapa(altura)}>
            <TileLayer attribution={ATRIBUCION} url={TESELAS} />
            <AjustarVista puntos={puntos} />
            {proyectos.map((p) => (
                <Marker key={p.id} position={[p.latitud, p.longitud]} icon={icono(p.tipo ?? null)}>
                    <Popup>
                        <strong>{p.nombre}</strong><br />{p.comuna}<br />
                        {p.resumen && <>{p.resumen}<br /></>}
                        {p.desde && <><strong>{p.desde}</strong><br /></>}
                        <Link href={`/proyectos/${p.id}`}>Ver proyecto</Link>
                    </Popup>
                </Marker>
            ))}
            {salas.map((s) => (
                <Marker key={`sala-${s.idProyecto}`} position={[s.latitud, s.longitud]} icon={icono('SALA')}>
                    <Popup>
                        <strong>Sala de ventas</strong> · {s.proyecto}<br />{s.direccion}<br />
                        {s.horario && <>{s.horario}<br /></>}
                        {s.telefono && <><a href={`tel:${s.telefono.replace(/\s/g, '')}`}>{s.telefono}</a><br /></>}
                        <a href={s.comoLlegar} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
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
