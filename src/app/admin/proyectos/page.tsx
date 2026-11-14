'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { despublicarProyecto, eliminarProyecto, getNormativa, getProyectosAdmin, publicarProyecto } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";
import { mensajeError } from "@/lib/errores";
import { avisar, confirmar } from "@/components/Dialogos";

interface FilaProyecto {
    proyecto: Proyecto;
    tieneNormativa: boolean;
}

function leerFilas(): Promise<FilaProyecto[]> {
    return getProyectosAdmin().then((proyectos) => Promise.all(proyectos.map(async (proyecto) => ({
        proyecto,
        // La API no entrega la normativa de un proyecto despublicado, así que no se consulta.
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
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        leerFilas()
            .then(setFilas)
            .catch(() => setError('No se pudieron cargar los proyectos'))
            .finally(() => setCargando(false));
    }, []);

    // Despublicar se puede revertir, por eso no se pide confirmación y se ofrece Deshacer.
    async function despublicar(proyecto: Proyecto) {
        try {
            await despublicarProyecto(proyecto.id);
            setError(null);
            setFilas(await leerFilas());
            avisar(`«${proyecto.nombre}» y sus modelos ya no se ven en el catálogo.`,
                { accion: { texto: 'Deshacer', alHacer: () => publicar(proyecto) } });
        } catch {
            avisar('No se pudo despublicar el proyecto', { error: true });
        }
    }

    async function publicar(proyecto: Proyecto) {
        try {
            await publicarProyecto(proyecto.id);
            setError(null);
            setFilas(await leerFilas());
        } catch {
            avisar('No se pudo volver a publicar el proyecto', { error: true });
        }
    }

    async function eliminar(proyecto: Proyecto) {
        const confirmado = await confirmar({
            titulo: `Eliminar «${proyecto.nombre}»`,
            mensaje: <>
                <p>Se borra definitivamente <strong>junto con todos sus modelos</strong>, sus fotos y su normativa. <strong>No se puede deshacer.</strong></p>
                <p>Si solo quieres sacarlo del catálogo, despublícalo. Si algún modelo tiene solicitudes de clientes, no se puede eliminar.</p>
            </>,
            boton: 'Eliminar definitivamente',
            peligroso: true,
            campo: { etiqueta: `Escribe «${proyecto.nombre}» para confirmar` },
            accion: async (texto) => {
                if (texto !== proyecto.nombre) return 'El nombre no coincide.';
                try {
                    await eliminarProyecto(proyecto.id);
                } catch (err) {
                    return mensajeError(err, 'No se pudo eliminar el proyecto');
                }
            },
        });
        if (confirmado === null) return;
        setFilas((lista) => lista.filter((f) => f.proyecto.id !== proyecto.id));
        avisar(`«${proyecto.nombre}» fue eliminado.`);
    }

    if (cargando) {
        return <main className="max-w-3xl mx-auto px-4 py-10">Cargando...</main>;
    }

    const termino = busqueda.trim().toLocaleLowerCase('es');
    const visibles = termino ? filas.filter(({ proyecto }) => proyecto.nombre.toLocaleLowerCase('es').includes(termino)) : filas;

    return (
        <main className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Proyectos</h1>
                <Link href="/admin/proyectos/nuevo" className="bg-marca text-white text-sm rounded-lg px-4 py-2 font-medium hover:bg-marca/90">Crear proyecto</Link>
            </div>
            {error && <p className="text-red-700">{error}</p>}
            {filas.length > 0 && (
                <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} maxLength={100}
                    placeholder="Buscar por nombre" aria-label="Buscar proyectos por nombre"
                    className="w-full border rounded-lg px-3 py-2 mb-4" />
            )}
            {filas.length === 0 && !error ? (
                <p className="text-gray-500">No hay proyectos todavía.</p>
            ) : visibles.length === 0 && termino ? (
                <p className="text-gray-500">Ningún proyecto coincide con «{busqueda.trim()}».</p>
            ) : (
                <div className="flex flex-col divide-y border rounded-xl">
                    {visibles.map(({ proyecto, tieneNormativa }) => (
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
                            <div className="flex flex-wrap gap-2">
                                {proyecto.activo ? (
                                    <>
                                        <Link href={`/admin/proyectos/${proyecto.id}`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                            Editar
                                        </Link>
                                        <button type="button" onClick={() => despublicar(proyecto)} className="text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50">
                                            Despublicar
                                        </button>
                                    </>
                                ) : (
                                    // Para editar un proyecto despublicado primero hay que publicarlo, porque la API no lo entrega.
                                    <button type="button" onClick={() => publicar(proyecto)} className="text-sm border border-green-200 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-50">
                                        Volver a publicar
                                    </button>
                                )}
                                <button type="button" onClick={() => eliminar(proyecto)} className="text-sm text-red-600 px-2 py-1.5 hover:underline">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
