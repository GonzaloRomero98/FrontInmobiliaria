'use client'

import Link from "next/link";
import { CargandoLista, ErrorCarga } from "@/components/panel/Tablero";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormularioUbicacion from "@/components/admin/FormularioUbicacion";
import FormularioDatosProyecto from "@/components/admin/FormularioDatosProyecto";
import FormularioNormativa from "@/components/admin/FormularioNormativa";
import FormularioSalaVentas from "@/components/admin/FormularioSalaVentas";
import { getNormativa, getProyectoPorId } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";
import { Normativa } from "@/types/normativa";
import { PANEL_PAGINA } from "@/lib/estilos";

export default function EditarProyecto() {
    const { id } = useParams<{ id: string }>();
    const [proyecto, setProyecto] = useState<Proyecto | null>(null);
    const [normativa, setNormativa] = useState<Normativa | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelado = false;
        Promise.all([getProyectoPorId(id), getNormativa(id)])
            .then(([p, n]) => { if (!cancelado) { setProyecto(p); setNormativa(n); } })
            .catch(() => { if (!cancelado) setError('No se pudo cargar el proyecto'); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [id]);

    if (cargando) return <main className={PANEL_PAGINA}><Link href="/admin/proyectos" className="text-sm text-gray-600 hover:underline">← Proyectos</Link><div className="max-w-3xl mt-4"><CargandoLista filas={4} alto="h-40" etiqueta="Cargando el proyecto" /></div></main>;
    if (error || !proyecto) return <ErrorCarga volverHref="/admin/proyectos" volverTexto="Proyectos" mensaje={error ?? 'No se pudo cargar el proyecto'} />;

    return (
        <main className={PANEL_PAGINA}>
            <div className="max-w-3xl flex flex-col gap-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                    <Link href="/admin/proyectos" className="text-sm text-gray-500 hover:underline">← Proyectos</Link>
                    <h1 className="text-2xl font-bold">{proyecto.nombre}</h1>
                    <p className="text-gray-500">{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}</p>
                </div>
                <Link href={`/proyectos/${proyecto.id}`} className="text-sm text-acento underline" target="_blank">Ver ficha pública</Link>
            </div>

            <FormularioDatosProyecto proyecto={proyecto} onGuardado={setProyecto} />
            <FormularioUbicacion proyecto={proyecto} onGuardado={setProyecto} />
            <FormularioSalaVentas proyecto={proyecto} onGuardado={setProyecto} />
            <FormularioNormativa idProyecto={proyecto.id} normativa={normativa} />
            </div>
        </main>
    );
}
