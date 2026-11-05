import { MapaEntorno } from "@/components/mapas";
import { CATEGORIAS_ENTORNO, CategoriaEntorno, EntornoProyecto as Datos } from "@/types/entorno";
import { formatearDistancia } from "@/lib/formato";

interface EntornoProyectoProps {
    nombre: string;
    latitud: number;
    longitud: number;
    datos: Datos | null;
}

export default function EntornoProyecto({ nombre, latitud, longitud, datos }: EntornoProyectoProps) {
    const entorno = datos?.entorno;
    const categorias = Object.keys(CATEGORIAS_ENTORNO) as CategoriaEntorno[];

    return (
        <section className="flex flex-col gap-4" aria-labelledby="titulo-entorno">
            <div>
                <h2 id="titulo-entorno" className="text-2xl font-bold">Ubicación y entorno</h2>
                {entorno && (
                    <p className="text-gray-500 text-sm mt-1">Servicios a menos de {formatearDistancia(entorno.radio)} del proyecto</p>
                )}
            </div>

            <MapaEntorno latitud={latitud} longitud={longitud} nombre={nombre} lugares={entorno?.lugares ?? []} radio={entorno?.radio ?? 1000} />

            {entorno && (
                <ul className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {categorias.map((c) => {
                        const masCercano = entorno.lugares.find((l) => l.categoria === c);
                        return (
                            <li key={c} className="p-3 border rounded-xl">
                                <p className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORIAS_ENTORNO[c].color }} />
                                    {CATEGORIAS_ENTORNO[c].etiqueta}
                                </p>
                                <p className="text-2xl font-semibold mt-1">{entorno.resumen[c]}</p>
                                {masCercano && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        Más cercano: {masCercano.nombre ?? CATEGORIAS_ENTORNO[c].sinNombre}, {formatearDistancia(masCercano.distancia)}
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
