'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { despublicarProyecto, eliminarProyecto, getNormativa, getProyectosAdmin, publicarProyecto } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";
import { mensajeError } from "@/lib/errores";
import { avisar, confirmar } from "@/components/Dialogos";
import { CargandoLista, Vacio } from "@/components/panel/Tablero";
import { COMPACTO, NORMAL, PANEL_EXITO, PANEL_PAGINA, PANEL_PELIGRO, PANEL_PRIMARIO, PANEL_SECUNDARIO, PILDORA, SUPERFICIE, TONO } from "@/lib/estilos";

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
        <span className={`${PILDORA} ${ok ? TONO.exito : TONO.neutro}`}>
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

    const termino = busqueda.trim().toLocaleLowerCase('es');
    const visibles = termino ? filas.filter(({ proyecto }) => proyecto.nombre.toLocaleLowerCase('es').includes(termino)) : filas;

    return (
        <main className={PANEL_PAGINA}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Proyectos</h1>
                <Link href="/admin/proyectos/nuevo" className={`${PANEL_PRIMARIO} ${NORMAL}`}>Crear proyecto</Link>
            </div>
            {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
            {filas.length > 0 && (
                <label className="flex flex-col gap-1 w-full sm:max-w-sm mb-4 text-sm font-medium text-gray-800">
                    Buscar proyecto
                    <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} maxLength={100}
                        placeholder="Nombre del proyecto"
                        className="border border-borde-campo rounded-lg px-3 py-2 text-base font-normal" />
                </label>
            )}
            {cargando ? (
                <CargandoLista etiqueta="Cargando proyectos" />
            ) : filas.length === 0 ? (
                !error && (
                    <Vacio texto="Todavía no hay proyectos.">
                        <Link href="/admin/proyectos/nuevo" className={`${PANEL_PRIMARIO} ${NORMAL}`}>Crear el primer proyecto</Link>
                    </Vacio>
                )
            ) : visibles.length === 0 ? (
                <Vacio texto={`Ningún proyecto coincide con «${busqueda.trim()}».`} />
            ) : (
                <div className={`${SUPERFICIE} flex flex-col divide-y divide-gray-200`}>
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
                                    <span className={`self-start ${PILDORA} ${TONO.aviso}`}>
                                        Despublicado: no se ve en el catálogo
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {proyecto.activo ? (
                                    <>
                                        <Link href={`/admin/proyectos/${proyecto.id}`} className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                                            Editar
                                        </Link>
                                        <button type="button" onClick={() => despublicar(proyecto)} className={`${PANEL_SECUNDARIO} ${COMPACTO}`}>
                                            Despublicar
                                        </button>
                                    </>
                                ) : (
                                    // Para editar un proyecto despublicado primero hay que publicarlo, porque la API no lo entrega.
                                    <button type="button" onClick={() => publicar(proyecto)} className={`${PANEL_EXITO} ${COMPACTO}`}>
                                        Volver a publicar
                                    </button>
                                )}
                                <button type="button" onClick={() => eliminar(proyecto)} className={`${PANEL_PELIGRO} ${COMPACTO}`}>
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
