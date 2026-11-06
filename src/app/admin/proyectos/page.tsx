'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { despublicarProyecto, getNormativa, getProyectos } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";

interface FilaProyecto {
    proyecto: Proyecto;
    tieneNormativa: boolean;
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
        getProyectos()
            .then((proyectos) => Promise.all(proyectos.map(async (proyecto) => ({
                proyecto,
                tieneNormativa: (await getNormativa(proyecto.id).catch(() => null)) !== null,
            }))))
            .then(setFilas)
            .catch(() => setError('No se pudo cargar los proyectos'))
            .finally(() => setCargando(false));
    }, []);

    async function despublicar(proyecto: Proyecto) {
        if (!confirm(`¿Despublicar "${proyecto.nombre}"? El proyecto y todos sus modelos dejarán de verse en el catálogo.`)) return;
        try {
            await despublicarProyecto(proyecto.id);
            setFilas((lista) => lista.filter((f) => f.proyecto.id !== proyecto.id));
        } catch {
            setError('No se pudo despublicar el proyecto');
        }
    }

    if (cargando) {
        return <main className="max-w-3xl mx-auto px-4 py-10">Cargando...</main>;
    }

    return (
        <main className="max-w-3xl mx-auto px-4 py-10">
            <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Panel</Link>
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
                                <p className="font-medium">{proyecto.nombre}</p>
                                <p className="text-sm text-gray-500">{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}</p>
                                <div className="flex gap-2">
                                    <Estado ok={proyecto.latitud !== null} texto="Ubicación en mapa" />
                                    <Estado ok={tieneNormativa} texto="Normativa" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link href={`/admin/proyectos/${proyecto.id}`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Editar
                                </Link>
                                <button type="button" onClick={() => despublicar(proyecto)} className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50">
                                    Despublicar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
