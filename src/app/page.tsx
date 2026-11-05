import Link from "next/link";
import ProyectoCard from "@/components/ProyectoCard";
import { MapaProyectos, PuntoProyecto } from "@/components/mapas";
import { getProyectos } from "@/services/proyecto.service";

// El catálogo se regenera cada minuto (sin esto quedaría fijo desde el último build)
export const revalidate = 60;

export default async function Home() {
    const proyectos = await getProyectos();
    const puntos: PuntoProyecto[] = proyectos
        .filter((p) => p.latitud !== null && p.longitud !== null)
        .map((p) => ({ id: p.id, nombre: p.nombre, comuna: p.ciudad.nombre, latitud: p.latitud!, longitud: p.longitud! }));

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-12">
            <section className="flex flex-col gap-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
                    Recorre tu próxima casa en 3D antes de visitarla
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                    Modelos 3D y realidad aumentada, simulador de dividendo, entorno del barrio y la normativa del
                    plan regulador de cada proyecto, en un solo lugar.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Link href="/buscar?tipoOperacion=VENTA" className="bg-black text-white rounded-lg px-5 py-3 font-medium">Comprar</Link>
                    <Link href="/buscar?tipoOperacion=ARRIENDO" className="border rounded-lg px-5 py-3 font-medium">Arrendar</Link>
                    <Link href="/buscar" className="px-5 py-3 font-medium underline">Ver todas las propiedades</Link>
                </div>
            </section>

            {puntos.length > 0 && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl font-bold">Dónde estamos</h2>
                    <MapaProyectos proyectos={puntos} />
                </section>
            )}

            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold">Proyectos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proyectos.map((proyecto) => (
                        <ProyectoCard key={proyecto.id} proyecto={proyecto} />
                    ))}
                </div>
            </section>
        </main>
    );
}
