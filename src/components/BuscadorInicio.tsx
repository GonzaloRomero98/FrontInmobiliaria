'use client'

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ETIQUETA_TIPO_VIVIENDA, Operacion, TipoVivienda } from "@/types/modeloCasa";
import { Ciudad } from "@/types/ubicacion";

const OPERACIONES: { valor: Operacion; texto: string; moneda: 'UF' | 'CLP' }[] = [
    { valor: 'VENTA', texto: 'Comprar', moneda: 'UF' },
    { valor: 'ARRIENDO', texto: 'Arrendar', moneda: 'CLP' },
];

// Buscador rápido de la home. Arma la misma URL que el buscador completo de /buscar.
// Solo ofrece las comunas que tienen proyectos publicados.
export default function BuscadorInicio({ comunas }: { comunas: Ciudad[] }) {
    const router = useRouter();
    const [operacion, setOperacion] = useState<Operacion>('VENTA');
    const [comuna, setComuna] = useState('');
    const [tipo, setTipo] = useState<TipoVivienda | ''>('');
    const [presupuesto, setPresupuesto] = useState('');
    const moneda = OPERACIONES.find((o) => o.valor === operacion)!.moneda;

    function buscar(e: React.FormEvent) {
        e.preventDefault();
        const ciudad = comunas.find((c) => String(c.id) === comuna);
        const params = new URLSearchParams({ tipoOperacion: operacion });
        // La región va junto a la comuna para que /buscar muestre la comuna elegida en sus filtros.
        if (ciudad) {
            params.set('id_region', String(ciudad.region.id));
            params.set('id_ciudad', String(ciudad.id));
        }
        if (tipo) params.set('tipoVivienda', tipo);
        if (presupuesto) {
            params.set('precioMax', presupuesto);
            params.set('moneda', moneda);
        }
        router.push(`/buscar?${params}`);
    }

    // text-base porque con letra menor a 16 px el iPhone hace zoom al tocar el campo.
    const campo = "w-full min-h-11 bg-transparent text-base text-gray-900 focus:outline-none";
    const caja = "flex flex-col gap-0.5 px-4 py-2.5 rounded-xl hover:bg-gray-50 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-acento/40";

    return (
        <div className="flex flex-col">
            <div className="flex gap-1 self-start rounded-t-xl bg-white p-1 pb-0 shadow-sm" role="group" aria-label="Tipo de operación">
                {OPERACIONES.map((o) => (
                    <button key={o.valor} type="button" aria-pressed={operacion === o.valor}
                        onClick={() => { setOperacion(o.valor); setPresupuesto(''); }}
                        className={`min-h-11 px-5 text-sm font-semibold border-b-2 transition-colors ${operacion === o.valor ? 'border-acento text-marca' : 'border-transparent text-gray-500 hover:text-marca'}`}>
                        {o.texto}
                    </button>
                ))}
            </div>

            <form onSubmit={buscar}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-1 p-2 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-lg shadow-slate-900/5">
                <label className={caja}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Comuna</span>
                    <select value={comuna} onChange={(e) => setComuna(e.target.value)} className={campo}>
                        <option value="">Todas las comunas</option>
                        {comunas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </label>

                <label className={caja}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tipo de propiedad</span>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoVivienda | '')} className={campo}>
                        <option value="">Casa o departamento</option>
                        {(Object.keys(ETIQUETA_TIPO_VIVIENDA) as TipoVivienda[]).map((t) => <option key={t} value={t}>{ETIQUETA_TIPO_VIVIENDA[t]}</option>)}
                    </select>
                </label>

                <label className={caja}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Presupuesto máximo ({moneda === 'UF' ? 'UF' : '$'})
                    </span>
                    <input type="number" min={0} inputMode="numeric" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)}
                        placeholder={moneda === 'UF' ? 'Ej: 3500' : 'Ej: 450000'} className={campo} />
                </label>

                <button type="submit"
                    className="sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-acento text-white font-semibold shadow-sm hover:brightness-110 transition">
                    <Search className="w-5 h-5" aria-hidden="true" />
                    Buscar propiedades
                </button>
            </form>
        </div>
    );
}
