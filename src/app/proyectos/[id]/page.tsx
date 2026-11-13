import type { Metadata } from "next";
import { cache } from "react";
import ModeloCasaCard from "@/components/ModeloCasaCard";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import EntornoProyecto from "@/components/EntornoProyecto";
import FichaNormativa from "@/components/FichaNormativa";
import { getEntorno, getNormativa, getProyectoPorId } from "@/services/proyecto.service";
import { getModeloCasa } from "@/services/modeloCasa.service";
import EtapaEntrega from "@/components/EtapaEntrega";
import SalaVentas from "@/components/SalaVentas";
import { obtenerValorUF } from "@/lib/uf";
import { formatearUF, plural, precioDesdeUF } from "@/lib/formato";
import { notFound } from "next/navigation";
import Image from "next/image";

export const revalidate = 60;
// Sin esto Next 16 arma la página en cada visita (4 llamadas a la API desde la IP del servidor, que comparten el
// límite de 100/min por IP): con lista vacía cada proyecto se genera al primer pedido y se cachea 60 s (ISR)
export async function generateStaticParams() { return []; }

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
    const [modelos, normativa, entorno, uf] = await Promise.all([
        getModeloCasa(id),
        getNormativa(id).catch(() => null),
        tieneUbicacion ? getEntorno(id).catch(() => null) : Promise.resolve(null),
        obtenerValorUF(),
    ]);
    const desde = precioDesdeUF(modelos, uf?.valor ?? null);

    return (
        <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10 flex flex-col gap-14">
            <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
                <div className="flex flex-col gap-5">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold">{proyecto.nombre}</h1>
                        <p className="text-gray-600 mt-2">
                            {proyecto.direccion ? `${proyecto.direccion}, ` : ''}{proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}
                        </p>
                        <EtapaEntrega etapa={proyecto.etapa} fechaEntrega={proyecto.fechaEntrega} />
                    </div>
                    {desde !== null && (
                        <div>
                            <p className="text-sm text-gray-600">Precios desde</p>
                            <p className="font-titulo text-3xl font-bold text-acento">{formatearUF(desde)}</p>
                        </div>
                    )}
                    {proyecto.descripcion && <p className="text-gray-700 leading-relaxed max-w-prose">{proyecto.descripcion}</p>}
                    <div className="flex flex-wrap gap-3">
                        {modelos.length > 0 && (
                            <a href="#modelos" className="bg-marca text-white rounded-lg px-5 py-3 font-medium hover:bg-marca/90 transition-colors">
                                Ver {plural(modelos.length, 'modelo', 'modelos')}
                            </a>
                        )}
                        <BotonWhatsApp mensaje={`Hola, me interesa el proyecto ${proyecto.nombre} en ${proyecto.ciudad.nombre}.`} />
                        {(tieneUbicacion || proyecto.salaDireccion) && (
                            <a href="#ubicacion" className="border rounded-lg px-5 py-3 font-medium hover:bg-gray-50 transition-colors">Ubicación y sala de ventas</a>
                        )}
                    </div>
                </div>
                {proyecto.imagenPortada && (
                    <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-100 order-first lg:order-0">
                        <Image src={proyecto.imagenPortada} alt={`Imagen del proyecto ${proyecto.nombre}`} fill priority
                            sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                    </div>
                )}
            </section>

            <section id="modelos" className="flex flex-col gap-4 scroll-mt-6">
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

            {tieneUbicacion ? (
                <EntornoProyecto nombre={proyecto.nombre} latitud={proyecto.latitud!} longitud={proyecto.longitud!} datos={entorno}
                    lateral={proyecto.salaDireccion ? <SalaVentas proyecto={proyecto} /> : undefined} />
            ) : proyecto.salaDireccion && (
                <div id="ubicacion" className="scroll-mt-6 max-w-sm"><SalaVentas proyecto={proyecto} /></div>
            )}

            {normativa && <FichaNormativa normativa={normativa} />}
        </main>
    );
}
