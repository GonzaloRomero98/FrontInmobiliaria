import type { Metadata } from "next";
import { cache } from "react";
import ModeloCasaCard from "@/components/ModeloCasaCard";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import EntornoProyecto from "@/components/EntornoProyecto";
import FichaNormativa from "@/components/FichaNormativa";
import { getEntorno, getNormativa, getProyectoPorId } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";
import { notFound } from "next/navigation";

export const revalidate = 60;

// generateMetadata y la página piden el mismo proyecto: cache() evita la doble llamada a la API
const obtenerProyecto = cache(async (id: string) => {
    try {
        return await getProyectoPorId(id);
    } catch (err) {
        console.error("error: ", err);
        return null;
    }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const proyecto = await obtenerProyecto((await params).id);
    if (!proyecto) return { title: 'Proyecto no encontrado' };
    const descripcion = proyecto.descripcion || `Proyecto inmobiliario en ${proyecto.ciudad.nombre}, ${proyecto.ciudad.region.nombre}.`;
    return {
        title: `${proyecto.nombre} en ${proyecto.ciudad.nombre}`,
        description: descripcion,
        alternates: { canonical: `/proyectos/${proyecto.id}` },
        openGraph: {
            title: proyecto.nombre,
            description: descripcion,
            images: proyecto.imagenPortada ? [{ url: proyecto.imagenPortada, alt: proyecto.nombre }] : undefined,
        },
    };
}

export default async function ProyectoDetalle({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const proyecto = await obtenerProyecto(id);
    if (!proyecto) notFound();

    const tieneUbicacion = proyecto.latitud !== null && proyecto.longitud !== null;
    // Normativa y entorno son opcionales: si fallan, la ficha se muestra sin esas secciones
    const [modelos, normativa, entorno] = await Promise.all([
        getModeloCasa(id),
        getNormativa(id).catch(() => null),
        tieneUbicacion ? getEntorno(id).catch(() => null) : Promise.resolve(null),
    ]);

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-12">
            <section className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold">{proyecto.nombre}</h1>
                <p className="text-gray-500">
                    {proyecto.direccion ? `${proyecto.direccion}, ` : ''}{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}
                </p>
                {proyecto.descripcion && <p className="text-gray-700 max-w-3xl">{proyecto.descripcion}</p>}
                <BotonWhatsApp
                    mensaje={`Hola, me interesa el proyecto ${proyecto.nombre} en ${proyecto.ciudad.nombre}.`}
                    className="self-start"
                />
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">Modelos disponibles</h2>
                {modelos.length === 0 ? (
                    <p className="text-gray-500">Todavía no hay modelos publicados para este proyecto.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modelos.map((modelo) => (
                            <ModeloCasaCard key={modelo.id} modelo={modelo} />
                        ))}
                    </div>
                )}
            </section>

            {tieneUbicacion && (
                <EntornoProyecto nombre={proyecto.nombre} latitud={proyecto.latitud!} longitud={proyecto.longitud!} datos={entorno} />
            )}

            {normativa && <FichaNormativa normativa={normativa} />}
        </main>
    );
}
