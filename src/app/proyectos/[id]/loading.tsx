import { Esqueleto, EsqueletoTarjeta, Linea } from "@/components/Esqueleto";

// Misma estructura que la ficha: título, cifras, botones, portada 4:3 y la grilla de modelos.
export default function CargandoProyecto() {
    return (
        <main role="status" className="max-w-6xl mx-auto px-4 py-8 sm:py-10 flex flex-col gap-14">
            <span className="sr-only">Cargando el proyecto…</span>
            <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
                <div className="flex flex-col gap-5">
                    <div>
                        <Linea className="h-9 my-1 w-3/4" />
                        <Linea className="h-4 mt-3 mb-1 w-1/2" />
                    </div>
                    <Linea className="h-8 my-1 w-40" />
                    <Linea className="h-4 my-1 w-full max-w-prose" />
                    <Linea className="h-4 my-1 w-2/3 max-w-prose" />
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Esqueleto className="min-h-12 sm:w-40" />
                        <Esqueleto className="min-h-12 sm:w-56" />
                    </div>
                </div>
                <Esqueleto className="aspect-4/3 order-first lg:order-0" />
            </section>
            <section className="flex flex-col gap-4">
                <Linea className="h-7 my-1 w-56" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }, (_, i) => <EsqueletoTarjeta key={i} />)}
                </div>
            </section>
        </main>
    );
}
