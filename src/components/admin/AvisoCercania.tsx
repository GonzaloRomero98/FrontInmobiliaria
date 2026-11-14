'use client'

import { isAxiosError } from "axios";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { formatearDistancia } from "@/lib/formato";
import { getProyectosAdmin } from "@/services/proyecto.service";
import { confirmar } from "@/components/Dialogos";

// Mismos valores que el backend: radio del entorno y distancia desde la que se pide confirmar un posible duplicado.
export const RADIO_ENTORNO_M = 1000;
export const DISTANCIA_DUPLICADO_M = 50;

export interface ProyectoEnMapa { id: string; nombre: string; activo: boolean; latitud: number; longitud: number }
export interface ProyectoCercano extends ProyectoEnMapa { distancia: number }

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const rad = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

export function proyectosCercanos(latitud: number | null, longitud: number | null, proyectos: ProyectoEnMapa[]): ProyectoCercano[] {
    if (latitud === null || longitud === null) return [];
    return proyectos
        .map((p) => ({ ...p, distancia: Math.round(distanciaMetros(latitud, longitud, p.latitud, p.longitud)) }))
        .filter((p) => p.distancia <= RADIO_ENTORNO_M)
        .sort((a, b) => a.distancia - b.distancia);
}

const nombreCon = (p: ProyectoCercano) => `«${p.nombre}»${p.activo ? '' : ' (despublicado)'}`;
// Bajo 100 m se muestra el metro exacto, porque formatearDistancia redondea a decenas.
const metros = (m: number) => m < 100 ? `${m} m` : formatearDistancia(m);

const preguntarCercania = async (mensaje: string) => await confirmar({
    titulo: '¿Es otro proyecto en el mismo lugar?',
    mensaje,
    boton: 'Guardar igual',
}) !== null;

export async function confirmarSiDuplicado(cercanos: ProyectoCercano[]): Promise<boolean> {
    const duplicado = cercanos.find((p) => p.distancia < DISTANCIA_DUPLICADO_M);
    return !duplicado || preguntarCercania(
        `El punto está a ${metros(duplicado.distancia)} del proyecto ${nombreCon(duplicado)}. Si es un error, cancela y mueve el punto en el mapa.`);
}

// Si la API responde 409 porque la lista local estaba desactualizada, se pregunta y se reintenta confirmando.
// Devuelve null si el admin decide no guardar.
export async function guardarConfirmandoCercania<T>(enviar: (confirmar: boolean) => Promise<T>, yaConfirmado: boolean): Promise<T | null> {
    try {
        return await enviar(yaConfirmado);
    } catch (error) {
        if (!yaConfirmado && isAxiosError(error) && error.response?.status === 409 && error.response.data?.cercanos) {
            return await preguntarCercania(error.response.data.message) ? enviar(true) : null;
        }
        throw error;
    }
}

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
