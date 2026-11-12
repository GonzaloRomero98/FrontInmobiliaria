'use client'

import { isAxiosError } from "axios";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { formatearDistancia } from "@/lib/formato";
import { getProyectosAdmin } from "@/services/proyecto.service";

// Mismos valores que el backend: radio del entorno y distancia a la que se pide confirmar (posible duplicado)
export const RADIO_ENTORNO_M = 1000;
export const DISTANCIA_DUPLICADO_M = 50;

export interface ProyectoEnMapa { id: string; nombre: string; activo: boolean; latitud: number; longitud: number }
export interface ProyectoCercano extends ProyectoEnMapa { distancia: number }

// Distancia en metros entre dos coordenadas (haversine)
function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const rad = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Los demás proyectos con ubicación (también los despublicados), para dibujarlos y avisar si el punto queda cerca
export function useProyectosEnMapa(excluirId?: string): ProyectoEnMapa[] {
    const [proyectos, setProyectos] = useState<ProyectoEnMapa[]>([]);
    useEffect(() => {
        getProyectosAdmin()
            .then((lista) => setProyectos(lista
                .filter((p) => p.id !== excluirId && p.latitud !== null && p.longitud !== null)
                .map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo, latitud: p.latitud!, longitud: p.longitud! }))))
            .catch(() => setProyectos([]));
    }, [excluirId]);
    return proyectos;
}

// Proyectos a menos de 1 km del punto, del más cercano al más lejano
export function proyectosCercanos(latitud: number | null, longitud: number | null, proyectos: ProyectoEnMapa[]): ProyectoCercano[] {
    if (latitud === null || longitud === null) return [];
    return proyectos
        .map((p) => ({ ...p, distancia: Math.round(distanciaMetros(latitud, longitud, p.latitud, p.longitud)) }))
        .filter((p) => p.distancia <= RADIO_ENTORNO_M)
        .sort((a, b) => a.distancia - b.distancia);
}

const nombreCon = (p: ProyectoCercano) => `«${p.nombre}»${p.activo ? '' : ' (despublicado)'}`;
// Bajo 100 m, el metro exacto (formatearDistancia redondea a decenas y "4 m" quedaría en "0 m")
const metros = (m: number) => m < 100 ? `${m} m` : formatearDistancia(m);

// Antes de guardar: si hay un proyecto casi en el mismo punto, el admin confirma. true = seguir.
export function confirmarSiDuplicado(cercanos: ProyectoCercano[]): boolean {
    const duplicado = cercanos.find((p) => p.distancia < DISTANCIA_DUPLICADO_M);
    return !duplicado || window.confirm(
        `El punto está a ${metros(duplicado.distancia)} del proyecto ${nombreCon(duplicado)}.\n\n¿Es otro proyecto en el mismo lugar? Acepta para guardar igual.`);
}

// Guarda; si la API igual responde 409 (la lista local estaba desactualizada), pregunta con su mensaje y reintenta
// confirmando. null = el admin decidió no guardar.
export async function guardarConfirmandoCercania<T>(enviar: (confirmar: boolean) => Promise<T>, yaConfirmado: boolean): Promise<T | null> {
    try {
        return await enviar(yaConfirmado);
    } catch (error) {
        if (!yaConfirmado && isAxiosError(error) && error.response?.status === 409 && error.response.data?.cercanos) {
            return window.confirm(`${error.response.data.message}\n\nAcepta para guardar igual.`) ? enviar(true) : null;
        }
        throw error;
    }
}

// Aviso bajo el mapa: proyectos dentro de 1 km del punto elegido, destacando los que están casi encima
export default function AvisoCercania({ cercanos }: { cercanos: ProyectoCercano[] }) {
    if (cercanos.length === 0) return null;
    const hayDuplicado = cercanos[0].distancia < DISTANCIA_DUPLICADO_M;
    return (
        <div role="status" className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${hayDuplicado ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            <div>
                <p className="font-medium">
                    {hayDuplicado
                        ? `Este punto está casi encima de ${nombreCon(cercanos[0])}: ¿es el mismo proyecto?`
                        : `Hay ${cercanos.length === 1 ? 'un proyecto' : `${cercanos.length} proyectos`} a menos de ${formatearDistancia(RADIO_ENTORNO_M)}. Revisa que la ubicación sea correcta.`}
                </p>
                <ul className="mt-1">
                    {cercanos.slice(0, 4).map((p) => (
                        <li key={p.id}>{nombreCon(p)}: a {metros(p.distancia)}</li>
                    ))}
                </ul>
                {hayDuplicado && <p className="mt-1 text-xs">Puedes guardar igual: se te pedirá confirmar.</p>}
            </div>
        </div>
    );
}
