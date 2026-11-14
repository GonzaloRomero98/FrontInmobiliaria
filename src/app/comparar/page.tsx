import type { Metadata } from "next";
import ComparadorSinSeleccion from "@/components/ComparadorSinSeleccion";
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

    // Los modelos que ya no existen o no están publicados se omiten.
    const resultados = await Promise.allSettled(solicitados.map((id) => getModeloCasaById(id)));
    const modelos = resultados
        .filter((r): r is PromiseFulfilledResult<ModeloCasa> => r.status === 'fulfilled')
        .map((r) => r.value);

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Comparar modelos</h1>
            {modelos.length === 0 ? <ComparadorSinSeleccion /> : <TablaComparacion modelos={modelos} />}
        </main>
    );
}
