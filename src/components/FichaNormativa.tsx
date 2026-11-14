import { Normativa, RIESGOS } from "@/types/normativa";
import { formatearNumero } from "@/lib/formato";

function fecha(iso: string): string {
    const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function alturaMaxima(n: Normativa): string | null {
    const partes = [
        n.alturaMaximaPisos !== null ? `${n.alturaMaximaPisos} ${n.alturaMaximaPisos === 1 ? 'piso' : 'pisos'}` : null,
        n.alturaMaximaMetros !== null ? `${formatearNumero(n.alturaMaximaMetros, 1)} m` : null,
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : null;
}

export default function FichaNormativa({ normativa }: { normativa: Normativa }) {
    const indicadores = [
        {
            titulo: 'Altura máxima permitida',
            valor: alturaMaxima(normativa),
            explicacion: 'Lo más alto que se puede construir en la zona: te dice si a futuro te pueden levantar un edificio al lado.',
        },
        {
            titulo: 'Densidad máxima',
            valor: normativa.densidadMaxima !== null ? `${formatearNumero(normativa.densidadMaxima, 0)} hab/ha` : null,
            explicacion: 'Cuántas personas pueden vivir por hectárea. Más densidad significa un barrio más poblado.',
        },
        {
            titulo: 'Constructibilidad',
            valor: normativa.coefConstructibilidad !== null ? formatearNumero(normativa.coefConstructibilidad) : null,
            explicacion: 'Metros cuadrados que se pueden construir por cada m² de terreno, sumando todos los pisos.',
        },
        {
            titulo: 'Ocupación de suelo',
            valor: normativa.coefOcupacionSuelo !== null ? `${formatearNumero(normativa.coefOcupacionSuelo * 100, 0)}%` : null,
            explicacion: 'Parte del terreno que puede cubrir la construcción en el primer piso. Importa si quieres ampliar.',
        },
    ].filter((i) => i.valor !== null);

    return (
        <section className="flex flex-col gap-5" aria-labelledby="titulo-normativa">
            <div>
                <h2 id="titulo-normativa" className="text-2xl font-bold">Normativa urbana</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Según el {normativa.instrumento} · Zona <strong className="text-gray-800">{normativa.zona}</strong>
                </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50">
                <h3 className="font-semibold">Usos permitidos en la zona</h3>
                <p className="text-gray-700 mt-1 whitespace-pre-line">{normativa.usosPermitidos}</p>
            </div>

            {indicadores.length > 0 && (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {indicadores.map((i) => (
                        <div key={i.titulo} className="p-4 border rounded-xl">
                            <dt className="text-sm text-gray-500">{i.titulo}</dt>
                            <dd className="text-xl font-semibold mt-1">{i.valor}</dd>
                            <dd className="text-sm text-gray-600 mt-2">{i.explicacion}</dd>
                        </div>
                    ))}
                </dl>
            )}

            <div>
                <h3 className="font-semibold mb-2">Áreas de riesgo</h3>
                {normativa.riesgos.length === 0 ? (
                    <p className="text-sm text-green-700">El instrumento no identifica áreas de riesgo en esta zona.</p>
                ) : (
                    <ul className="flex flex-wrap gap-2">
                        {normativa.riesgos.map((r) => (
                            <li key={r} className="text-sm bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                                ⚠ {RIESGOS[r] ?? r}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {normativa.observaciones && <p className="text-gray-700 whitespace-pre-line">{normativa.observaciones}</p>}

            <p className="text-xs text-gray-500 leading-relaxed">
                Información referencial consultada el {fecha(normativa.fechaConsulta)}
                {normativa.urlOrdenanza && (
                    <> en la <a href={normativa.urlOrdenanza} target="_blank" rel="noreferrer" className="underline">ordenanza oficial</a></>
                )}
                . Los planes reguladores se modifican: la información vigente y oficial de un terreno es el Certificado
                de Informaciones Previas (CIP) que emite la Dirección de Obras Municipales.
            </p>
        </section>
    );
}
