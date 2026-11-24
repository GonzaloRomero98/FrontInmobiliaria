import { Esqueleto, Linea } from "@/components/Esqueleto";

// Misma estructura que la ficha: encabezado, galería 4:3 y tarjeta de precio a la derecha en escritorio.
export default function CargandoModelo() {
    return (
        <main role="status" className="max-w-6xl mx-auto px-4 pt-8 pb-28 sm:pt-10 lg:pb-10 flex flex-col gap-6">
            <span className="sr-only">Cargando el modelo…</span>
            <header>
                <Linea className="h-4 my-1 w-40" />
                <Linea className="h-9 mt-3 mb-1 w-2/3" />
                <Linea className="h-4 mt-2 mb-1 w-1/3" />
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-10 items-start">
                <div className="lg:col-span-2">
                    <Esqueleto className="aspect-4/3" />
                </div>
                <Esqueleto className="h-72 lg:col-start-3 lg:row-start-1" />
            </div>
        </main>
    );
}
