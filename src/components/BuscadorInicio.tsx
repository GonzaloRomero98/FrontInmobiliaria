'use client'

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ETIQUETA_TIPO_VIVIENDA, Operacion, TipoVivienda } from "@/types/modeloCasa";
import { Ciudad } from "@/types/ubicacion";
import Desplegable from "./Desplegable";

const OPCIONES_TIPO = (Object.keys(ETIQUETA_TIPO_VIVIENDA) as TipoVivienda[]).map((t) => ({ valor: t, texto: ETIQUETA_TIPO_VIVIENDA[t] }));

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
    const campo = "w-full appearance-none bg-transparent border-0 p-0 pr-7 text-base font-medium text-gray-900 truncate focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]";
    const campoDesplegable = "bg-transparent text-base font-medium text-gray-900 focus:outline-none";
    const caja = "relative flex flex-col gap-1 px-5 py-3 rounded-xl hover:bg-gray-50 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-acento transition-colors";
    const etiqueta = "text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap";

    return (
        <div className="flex flex-col">
            <div className="flex self-start rounded-t-2xl bg-white px-2 pt-1 shadow-sm" role="group" aria-label="Tipo de operación">
                {OPERACIONES.map((o) => (
                    <button key={o.valor} type="button" aria-pressed={operacion === o.valor}
                        onClick={() => { setOperacion(o.valor); setPresupuesto(''); }}
                        className={`min-h-11 px-5 text-sm font-semibold border-b-2 transition-colors ${operacion === o.valor ? 'border-acento text-marca' : 'border-transparent text-gray-500 hover:text-marca'}`}>
                        {o.texto}
                    </button>
                ))}
            </div>

            <form onSubmit={buscar}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] items-center gap-1 lg:gap-0 p-2 rounded-2xl rounded-tl-none bg-white shadow-lg shadow-slate-900/8 ring-1 ring-gray-100">
                <label className={caja}>
                    <span className={etiqueta}>Comuna</span>
                    <Desplegable etiqueta="Comuna" valor={comuna} onChange={setComuna} className={campoDesplegable}
                        opciones={[{ valor: '', texto: 'Todas las comunas' }, ...comunas.map((c) => ({ valor: String(c.id), texto: c.nombre }))]} />
                </label>

                <label className={`${caja} lg:before:absolute lg:before:left-0 lg:before:inset-y-3 lg:before:w-px lg:before:bg-gray-200`}>
                    <span className={etiqueta}>Tipo de propiedad</span>
                    <Desplegable etiqueta="Tipo de propiedad" valor={tipo} onChange={(v) => setTipo(v as TipoVivienda | '')} className={campoDesplegable}
                        opciones={[{ valor: '', texto: 'Casa o departamento' }, ...OPCIONES_TIPO]} />
                </label>

                <label className={`${caja} sm:col-span-2 lg:col-span-1 lg:before:absolute lg:before:left-0 lg:before:inset-y-3 lg:before:w-px lg:before:bg-gray-200`}>
                    <span className={etiqueta}>Presupuesto máximo ({moneda === 'UF' ? 'UF' : '$'})</span>
                    <input type="number" min={0} inputMode="numeric" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)}
                        placeholder={moneda === 'UF' ? 'Ej: 3500' : 'Ej: 450000'} className={`${campo} cursor-text placeholder:font-normal`} />
                </label>

                <button type="submit"
                    className="sm:col-span-2 lg:col-span-1 lg:ml-2 flex items-center justify-center gap-2 min-h-13 px-7 rounded-xl bg-acento text-white font-semibold shadow-sm hover:brightness-110 transition whitespace-nowrap">
                    <Search className="w-5 h-5" aria-hidden="true" />
                    Buscar propiedades
                </button>
            </form>
        </div>
    );
}
