'use client'

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormularioUbicacion from "@/components/admin/FormularioUbicacion";
import FormularioDatosProyecto from "@/components/admin/FormularioDatosProyecto";
import FormularioNormativa from "@/components/admin/FormularioNormativa";
import { getNormativa, getProyectoPorId } from "@/services/proyecto.service";
import { Proyecto } from "@/types/proyecto";
import { Normativa } from "@/types/normativa";

export default function EditarProyecto() {
    const { id } = useParams<{ id: string }>();
    const [proyecto, setProyecto] = useState<Proyecto | null>(null);
    const [normativa, setNormativa] = useState<Normativa | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getProyectoPorId(id), getNormativa(id)])
            .then(([p, n]) => { setProyecto(p); setNormativa(n); })
            .catch(() => setError('No se pudo cargar el proyecto'))
            .finally(() => setCargando(false));
    }, [id]);

    if (cargando) return <main className="max-w-3xl mx-auto px-4 py-10">Cargando...</main>;
    if (error || !proyecto) return <main className="max-w-3xl mx-auto px-4 py-10 text-red-500">{error}</main>;

    return (
        <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
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
            <FormularioNormativa idProyecto={proyecto.id} normativa={normativa} />
        </main>
    );
}
