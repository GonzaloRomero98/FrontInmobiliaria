'use client'

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, ScaleControl, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { CATEGORIAS_ENTORNO, LugarCercano } from '@/types/entorno';
import { formatearDistancia } from '@/lib/formato';
import { ColorPunto, htmlSimbolo, TipoPunto } from './simbolos';

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
    // Color propio del proyecto (lo comparte con su sala de ventas)
    color: ColorPunto;
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
    color: ColorPunto;
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
function icono(tipo: TipoPunto | null, color: ColorPunto): L.DivIcon {
    const clave = `${tipo ?? 'NINGUNO'}-${color.fondo}`;
    if (!iconos.has(clave)) {
        iconos.set(clave, L.divIcon({
            className: '', html: htmlSimbolo(tipo, 26, color),
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
                <Marker key={p.id} position={[p.latitud, p.longitud]} icon={icono(p.tipo ?? null, p.color)}>
                    <Popup>
                        <strong>{p.nombre}</strong><br />{p.comuna}<br />
                        {p.resumen && <>{p.resumen}<br /></>}
                        {p.desde && <><strong>{p.desde}</strong><br /></>}
                        <Link href={`/proyectos/${p.id}`}>Ver proyecto</Link>
                    </Popup>
                </Marker>
            ))}
            {salas.map((s) => (
                <Marker key={`sala-${s.idProyecto}`} position={[s.latitud, s.longitud]} icon={icono('SALA', s.color)}>
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

// Radio del entorno en el color de acento de la marca: borde punteado (se lee como zona, no como calle) y relleno suave
const COLOR_RADIO = '#1e727d';

// Encuadra el mapa para que el círculo completo quepa en cualquier pantalla (un zoom fijo lo cortaba)
function EncuadrarRadio({ latitud, longitud, radio }: { latitud: number; longitud: number; radio: number }) {
    const mapa = useMap();
    useEffect(() => {
        mapa.fitBounds(L.latLng(latitud, longitud).toBounds(radio * 2), { padding: [16, 16] });
    }, [mapa, latitud, longitud, radio]);
    return null;
}

// Etiqueta con la distancia, centrada sobre el borde norte del círculo
function etiquetaRadio(radio: number): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `<span style="position:absolute;transform:translate(-50%,-50%);white-space:nowrap;background:#fff;color:${COLOR_RADIO};border:1.5px solid ${COLOR_RADIO};border-radius:999px;padding:2px 10px;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,.15)">${formatearDistancia(radio)} a la redonda</span>`,
        iconSize: [0, 0],
    });
}

export function MapaEntornoLeaflet({ latitud, longitud, nombre, lugares, radio }: {
    latitud: number; longitud: number; nombre: string; lugares: LugarCercano[]; radio: number;
}) {
    const etiqueta = useMemo(() => etiquetaRadio(radio), [radio]);
    // zoomSnap 0.25: el encuadre puede quedar entre niveles enteros y el círculo ocupa casi todo el alto
    return (
        <MapContainer center={[latitud, longitud]} zoom={15} zoomSnap={0.25} scrollWheelZoom={false} style={estiloMapa(420)}>
            <TileLayer attribution={ATRIBUCION} url={TESELAS} />
            <EncuadrarRadio latitud={latitud} longitud={longitud} radio={radio} />
            <ScaleControl imperial={false} position="bottomleft" />
            <Circle center={[latitud, longitud]} radius={radio} interactive={false}
                pathOptions={{ color: COLOR_RADIO, weight: 2.5, dashArray: '8 6', fillColor: COLOR_RADIO, fillOpacity: 0.07 }} />
            {/* 1 grado de latitud ≈ 111.320 m: así la etiqueta queda justo sobre el borde norte */}
            <Marker position={[latitud + radio / 111_320, longitud]} icon={etiqueta} interactive={false} keyboard={false} />
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
