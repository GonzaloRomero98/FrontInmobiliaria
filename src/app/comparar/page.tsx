import type { Metadata } from "next";
import { Suspense } from "react";
import ComparadorSinSeleccion from "@/components/ComparadorSinSeleccion";
import { ESQUELETO, Linea } from "@/components/Esqueleto";
import TablaComparacion from "@/components/TablaComparacion";
import { getModeloCasaById } from "@/services/modeloCasa.service";
import { MAXIMO_COMPARAR } from "@/lib/sitio";
import { ModeloCasa } from "@/types/modeloCasa";

export const metadata: Metadata = {
    title: "Comparar modelos",
    description: "Compara modelos de casa lado a lado, con su recorrido 3D, precio, superficie y equipamiento.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Comparar({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
    const { ids = '' } = await searchParams;
    const solicitados = [...new Set(ids.split(',').map((id) => id.trim()).filter((id) => UUID.test(id)))].slice(0, MAXIMO_COMPARAR);

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Comparar modelos</h1>
            {/* Sin key: al quitar un modelo se mantiene la tabla actual hasta que llega la nueva, sin pasar por el esqueleto. */}
            {solicitados.length === 0 ? <ComparadorSinSeleccion /> : (
                <Suspense fallback={<CargandoComparacion columnas={solicitados.length} />}>
                    <Comparacion ids={solicitados} />
                </Suspense>
            )}
        </main>
    );
}

async function Comparacion({ ids }: { ids: string[] }) {
    // Los modelos que ya no existen o no están publicados se omiten.
    const resultados = await Promise.allSettled(ids.map((id) => getModeloCasaById(id)));
    const modelos = resultados
        .filter((r): r is PromiseFulfilledResult<ModeloCasa> => r.status === 'fulfilled')
        .map((r) => r.value);
    return modelos.length === 0 ? <ComparadorSinSeleccion /> : <TablaComparacion modelos={modelos} />;
}

// Misma grilla que TablaComparacion: visor de 260 px, nombre, "Quitar" y las 10 filas de datos que siempre muestra.
function CargandoComparacion({ columnas }: { columnas: number }) {
    const grilla = { gridTemplateColumns: `minmax(120px, 180px) repeat(${columnas}, minmax(220px, 1fr))` };
    const celdas = Array.from({ length: columnas }, (_, i) => i);
    return (
        <div role="status" className="overflow-x-auto -mx-4 px-4">
            <span className="sr-only">Cargando la comparación…</span>
            <div className="grid gap-x-4 min-w-max sm:min-w-0" style={grilla}>
                <div />
                {celdas.map((i) => (
                    <div key={i} className="flex flex-col gap-2 pb-4">
                        <div aria-hidden="true" className={`${ESQUELETO} h-[260px] rounded-xl`} />
                        <Linea className="h-5 my-1 w-2/3" />
                        <Linea className="h-3 my-1 w-1/2" />
                    </div>
                ))}
                {Array.from({ length: 10 }, (_, fila) => (
                    <div key={fila} className="contents">
                        <div className="py-3 border-t"><Linea className="h-3 my-1 w-3/4" /></div>
                        {celdas.map((i) => <div key={i} className="py-3 border-t"><Linea className="h-4 my-1 w-1/2" /></div>)}
                    </div>
                ))}
            </div>
        </div>
    );
}
