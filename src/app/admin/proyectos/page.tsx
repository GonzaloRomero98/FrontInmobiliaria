'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { despublicarProyecto, getNormativa, getProyectosAdmin, publicarProyecto } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";

interface FilaProyecto {
    proyecto: Proyecto;
    tieneNormativa: boolean;
}

function leerFilas(): Promise<FilaProyecto[]> {
    return getProyectosAdmin().then((proyectos) => Promise.all(proyectos.map(async (proyecto) => ({
        proyecto,
        // La API no entrega la normativa de un despublicado; para ellos no se consulta
        tieneNormativa: proyecto.activo && (await getNormativa(proyecto.id).catch(() => null)) !== null,
    }))));
}

function Estado({ ok, texto }: { ok: boolean; texto: string }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500'}`}>
            {ok ? '✓' : '—'} {texto}
        </span>
    );
}

export default function ListadoProyectos() {
    const [filas, setFilas] = useState<FilaProyecto[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        leerFilas()
            .then(setFilas)
            .catch(() => setError('No se pudo cargar los proyectos'))
            .finally(() => setCargando(false));
    }, []);

    async function despublicar(proyecto: Proyecto) {
        if (!confirm(`¿Despublicar "${proyecto.nombre}"? El proyecto y todos sus modelos dejarán de verse en el catálogo. Podrás volver a publicarlo desde esta lista.`)) return;
        try {
            await despublicarProyecto(proyecto.id);
            setError(null);
            setFilas(await leerFilas());
        } catch {
            setError('No se pudo despublicar el proyecto');
        }
    }

    async function publicar(proyecto: Proyecto) {
        try {
            await publicarProyecto(proyecto.id);
            setError(null);
            setFilas(await leerFilas());
        } catch {
            setError('No se pudo volver a publicar el proyecto');
        }
    }

    if (cargando) {
        return <main className="max-w-3xl mx-auto px-4 py-10">Cargando...</main>;
    }

    return (
        <main className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Proyectos</h1>
                <Link href="/admin/proyectos/nuevo" className="text-sm text-acento underline">Crear proyecto</Link>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {filas.length === 0 && !error ? (
                <p className="text-gray-500">No hay proyectos todavía.</p>
            ) : (
                <div className="flex flex-col divide-y border rounded-xl">
                    {filas.map(({ proyecto, tieneNormativa }) => (
                        <div key={proyecto.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <div className="flex flex-col gap-1">
                                <p className={`font-medium ${proyecto.activo ? '' : 'text-gray-500'}`}>{proyecto.nombre}</p>
                                <p className="text-sm text-gray-500">{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}</p>
                                {proyecto.activo ? (
                                    <div className="flex gap-2">
                                        <Estado ok={proyecto.latitud !== null} texto="Ubicación en mapa" />
                                        <Estado ok={tieneNormativa} texto="Normativa" />
                                    </div>
                                ) : (
                                    <span className="self-start text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                                        Despublicado: no se ve en el catálogo
                                    </span>
                                )}
                            </div>
                            {proyecto.activo ? (
                                <div className="flex flex-wrap gap-2">
                                    <Link href={`/admin/proyectos/${proyecto.id}`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                        Editar
                                    </Link>
                                    <button type="button" onClick={() => despublicar(proyecto)} className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50">
                                        Despublicar
                                    </button>
                                </div>
                            ) : (
                                // Para editarlo hay que publicarlo primero: la API no expone los despublicados
                                <button type="button" onClick={() => publicar(proyecto)} className="text-sm border border-green-200 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-50">
                                    Volver a publicar
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
