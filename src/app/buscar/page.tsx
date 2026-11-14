import type { Metadata } from "next";
import FiltrosBusqueda from "@/components/FiltrosBusqueda";
import ModeloCasaCard from "@/components/ModeloCasaCard";
import { buscarModelos } from "@/services/modeloCasa.service";
import { obtenerValorUF } from "@/lib/uf";
import { FiltrosBusqueda as Filtros, ModeloCasa } from "@/types/modeloCasa";

export const metadata: Metadata = {
    title: "Buscar propiedades",
    description: "Filtra casas y departamentos por precio, comuna, dormitorios, baños y superficie.",
};

const CLAVES: (keyof Filtros)[] = [
    'tipoOperacion', 'id_region', 'id_ciudad', 'moneda', 'precioMin', 'precioMax',
    'dormitorios', 'banos', 'superficieMin', 'mascotas', 'orden',
];

// Solo se envían al backend los filtros conocidos y con valor. El formato lo valida el backend.
function leerFiltros(params: Record<string, string | string[] | undefined>): Filtros {
    const filtros: Record<string, string> = {};
    for (const clave of CLAVES) {
        const valor = params[clave];
        if (typeof valor === 'string' && valor.trim()) filtros[clave] = valor.trim();
    }
    return filtros as Filtros;
}

export default async function Buscar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const filtros = leerFiltros(await searchParams);

    let modelos: ModeloCasa[] = [];
    let error = false;
    // Si la UF falla, las tarjetas se muestran igual pero sin el precio en pesos.
    const ufPromesa = obtenerValorUF().catch(() => null);
    try {
        modelos = await buscarModelos(filtros);
    } catch {
        error = true;
    }
    const uf = await ufPromesa;

    return (
        <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Buscar propiedades</h1>

            {/* La key reinicia el formulario cuando la URL cambia con atrás o adelante. */}
            <FiltrosBusqueda key={JSON.stringify(filtros)} iniciales={filtros} />

            {error ? (
                <p className="text-red-600">No pudimos aplicar esos filtros. Revisa los valores e intenta de nuevo.</p>
            ) : (
                <>
                    <h2 className="sr-only">Resultados</h2>
                    <p className="text-gray-600">
                        {modelos.length === 0
                            ? 'No hay propiedades con esos filtros. Prueba ampliando el rango de precio o la ubicación.'
                            : `${modelos.length} ${modelos.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modelos.map((modelo) => (
                            <ModeloCasaCard key={modelo.id} modelo={modelo} valorUF={uf?.valor ?? null} />
                        ))}
                    </div>
                </>
            )}
        </main>
    );
}
