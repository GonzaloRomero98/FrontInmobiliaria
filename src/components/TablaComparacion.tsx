'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Visor3D from "./Visor3D";
import { useComparador } from "@/lib/comparador";
import { formatearNumero, formatearPrecio } from "@/lib/formato";
import { ModeloCasa } from "@/types/modeloCasa";

interface Fila {
    etiqueta: string;
    valor: (m: ModeloCasa) => number | string | null;
    mostrar?: (m: ModeloCasa) => string;
    mejor?: 'mayor' | 'menor';
}

function precioPorM2(m: ModeloCasa): number | null {
    return m.superficieConstruida > 0 ? m.precio / m.superficieConstruida : null;
}

export default function TablaComparacion({ modelos }: { modelos: ModeloCasa[] }) {
    const router = useRouter();
    const { reemplazar } = useComparador();

    const idsClave = modelos.map((m) => m.id).join(',');
    useEffect(() => {
        reemplazar(idsClave ? idsClave.split(',') : []);
    }, [idsClave, reemplazar]);

    function quitar(id: string) {
        const restantes = modelos.map((m) => m.id).filter((x) => x !== id);
        reemplazar(restantes);
        router.replace(restantes.length ? `/comparar?ids=${restantes.join(',')}` : '/comparar');
    }

    // Los precios solo se comparan si todos están en la misma moneda.
    const mismaMoneda = new Set(modelos.map((m) => m.moneda)).size === 1;
    const moneda = modelos[0]?.moneda;

    const filas: Fila[] = [
        { etiqueta: 'Precio', valor: (m) => m.precio, mostrar: (m) => formatearPrecio(m.precio, m.moneda), mejor: mismaMoneda ? 'menor' : undefined },
        {
            etiqueta: 'Precio por m²', valor: precioPorM2,
            mostrar: (m) => { const v = precioPorM2(m); return v === null ? '—' : formatearPrecio(v, m.moneda); },
            mejor: mismaMoneda ? 'menor' : undefined,
        },
        { etiqueta: 'Operación', valor: (m) => m.tipoOperacion === 'VENTA' ? 'Venta' : 'Arriendo' },
        { etiqueta: 'Ubicación', valor: (m) => `${m.proyecto.nombre}, ${m.proyecto.ciudad.nombre}` },
        { etiqueta: 'Dormitorios', valor: (m) => m.dormitorios, mejor: 'mayor' },
        { etiqueta: 'Baños', valor: (m) => m.banos, mejor: 'mayor' },
        { etiqueta: 'Estacionamientos', valor: (m) => m.estacionamientos, mejor: 'mayor' },
        { etiqueta: 'Superficie construida', valor: (m) => m.superficieConstruida, mostrar: (m) => `${formatearNumero(m.superficieConstruida)} m²`, mejor: 'mayor' },
        { etiqueta: 'Superficie terreno', valor: (m) => m.superficieTerreno, mostrar: (m) => m.superficieTerreno == null ? '—' : `${formatearNumero(m.superficieTerreno)} m²`, mejor: 'mayor' },
        { etiqueta: 'Mascotas', valor: (m) => m.mascotas ? 'Sí' : 'No' },
    ];

    function esMejor(fila: Fila, m: ModeloCasa): boolean {
        if (!fila.mejor || modelos.length < 2) return false;
        const valores = modelos.map(fila.valor).filter((v): v is number => typeof v === 'number');
        const v = fila.valor(m);
        if (typeof v !== 'number' || valores.length < 2 || new Set(valores).size === 1) return false;
        return v === (fila.mejor === 'mayor' ? Math.max(...valores) : Math.min(...valores));
    }

    const caracteristicas = [...new Map(modelos.flatMap((m) => m.caracteristicas).map((c) => [c.id, c])).values()]
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const columnas = { gridTemplateColumns: `minmax(120px, 180px) repeat(${modelos.length}, minmax(220px, 1fr))` };

    return (
        <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid gap-x-4 min-w-max sm:min-w-0" style={columnas}>
                <div />
                {modelos.map((m) => (
                    <div key={m.id} className="flex flex-col gap-2 pb-4">
                        {m.modelo3dUrl ? (
                            <Visor3D idModelo={m.id} modeloUrl={m.modelo3dUrl} titulo={m.nombreModelo} altura={260} rotarAutomatico={false} />
                        ) : (
                            <img src={m.imgPrincipal} alt={m.nombreModelo} className="w-full h-[260px] object-cover rounded-xl bg-gray-100" />
                        )}
                        <Link href={`/modelosCasa/${m.id}`} className="font-semibold text-lg hover:underline">{m.nombreModelo}</Link>
                        <button type="button" onClick={() => quitar(m.id)} className="text-sm text-gray-500 hover:text-marca self-start">
                            Quitar de la comparación
                        </button>
                    </div>
                ))}

                {filas.map((fila) => (
                    <div key={fila.etiqueta} className="contents">
                        <div className="py-3 border-t text-sm text-gray-500">{fila.etiqueta}</div>
                        {modelos.map((m) => {
                            const mejor = esMejor(fila, m);
                            return (
                                <div key={m.id} className={`py-3 border-t ${mejor ? 'font-semibold text-green-700' : ''}`}>
                                    {fila.mostrar ? fila.mostrar(m) : String(fila.valor(m) ?? '—')}
                                    {mejor && <span className="ml-2 text-xs bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Mejor</span>}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {caracteristicas.map((c) => (
                    <div key={c.id} className="contents">
                        <div className="py-3 border-t text-sm text-gray-500">{c.nombre}</div>
                        {modelos.map((m) => (
                            <div key={m.id} className="py-3 border-t">
                                {m.caracteristicas.some((x) => x.id === c.id) ? '✓' : <span className="text-gray-300">—</span>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {!mismaMoneda && moneda && (
                <p className="text-xs text-gray-500 mt-4">Hay precios en UF y en pesos: no se marca el más conveniente.</p>
            )}
        </div>
    );
}
