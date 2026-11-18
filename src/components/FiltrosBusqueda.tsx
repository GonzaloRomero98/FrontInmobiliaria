'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gerRegiones, getCiudades } from "@/services/ubicacion.service";
import { Ciudad, Region } from "@/types/ubicacion";
import { ETIQUETA_TIPO_VIVIENDA, FiltrosBusqueda as Filtros, Operacion, TipoVivienda } from "@/types/modeloCasa";
import Desplegable from "./Desplegable";

const MINIMOS = ['1', '2', '3', '4'].map((n) => ({ valor: n, texto: `${n}+` }));
const TODAS = { valor: '', texto: 'Todas' };
const CUALQUIERA = { valor: '', texto: 'Cualquiera' };
const OPCIONES_TIPO = (Object.keys(ETIQUETA_TIPO_VIVIENDA) as TipoVivienda[]).map((t) => ({ valor: t, texto: ETIQUETA_TIPO_VIVIENDA[t] }));
const ORDENES = [
    { valor: '', texto: 'Nombre' },
    { valor: 'precio_asc', texto: 'Menor precio' },
    { valor: 'precio_desc', texto: 'Mayor precio' },
    { valor: 'superficie_desc', texto: 'Mayor superficie' },
    { valor: 'recientes', texto: 'Más recientes' },
];

// Filtros secundarios. En el celular quedan plegados en "Más filtros".
const EXTRAS = ['orden', 'dormitorios', 'banos', 'superficieMin', 'mascotas'] as const;

// La venta se publica en UF y el arriendo en pesos.
const MONEDA_POR_OPERACION: Record<Operacion, 'UF' | 'CLP'> = { VENTA: 'UF', ARRIENDO: 'CLP' };

export default function FiltrosBusqueda({ iniciales }: { iniciales: Filtros }) {
    const router = useRouter();
    const [filtros, setFiltros] = useState<Filtros>(iniciales);
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);
    const extrasActivos = EXTRAS.filter((clave) => filtros[clave]).length;
    const [masFiltros, setMasFiltros] = useState(() => EXTRAS.some((clave) => iniciales[clave]));

    useEffect(() => {
        gerRegiones().then(setRegiones).catch(() => setRegiones([]));
    }, []);

    useEffect(() => {
        if (!filtros.id_region) return;
        getCiudades(Number(filtros.id_region)).then(setCiudades).catch(() => setCiudades([]));
    }, [filtros.id_region]);

    const ciudadesDeRegion = filtros.id_region ? ciudades : [];

    function cambiar<K extends keyof Filtros>(clave: K, valor: Filtros[K] | '') {
        setFiltros((actual) => {
            const siguiente = { ...actual, [clave]: valor || undefined };
            if (clave === 'id_region') siguiente.id_ciudad = undefined;
            if (clave === 'tipoOperacion') {
                // Al cambiar de operación cambia la moneda, así que se limpia el rango de precio.
                siguiente.precioMin = undefined;
                siguiente.precioMax = undefined;
            }
            return siguiente;
        });
    }

    function buscar(e: React.FormEvent) {
        e.preventDefault();
        const moneda = filtros.tipoOperacion ? MONEDA_POR_OPERACION[filtros.tipoOperacion] : undefined;
        const params = new URLSearchParams();
        for (const [clave, valor] of Object.entries({ ...filtros, moneda: filtros.precioMin || filtros.precioMax ? moneda : undefined })) {
            if (valor) params.set(clave, String(valor));
        }
        router.push(`/buscar${params.size ? `?${params}` : ''}`);
    }

    const moneda = filtros.tipoOperacion ? MONEDA_POR_OPERACION[filtros.tipoOperacion] : null;
    // text-base porque con letra menor a 16 px el iPhone hace zoom al tocar el campo.
    const campo = "w-full min-h-11 border border-borde-campo rounded-lg px-3 py-2 bg-white text-base disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";

    return (
        <form onSubmit={buscar} className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border rounded-xl bg-gray-50">
            <label className="flex flex-col gap-1 text-sm col-span-2 lg:col-span-1">
                Operación
                <Desplegable etiqueta="Operación" valor={filtros.tipoOperacion ?? ''} onChange={(v) => cambiar('tipoOperacion', v as Operacion)} className={campo}
                    opciones={[{ valor: '', texto: 'Venta o arriendo' }, { valor: 'VENTA', texto: 'Venta' }, { valor: 'ARRIENDO', texto: 'Arriendo' }]} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Región
                <Desplegable etiqueta="Región" valor={filtros.id_region ?? ''} onChange={(v) => cambiar('id_region', v)} className={campo}
                    opciones={[TODAS, ...regiones.map((r) => ({ valor: String(r.id), texto: r.nombre }))]} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Comuna
                <Desplegable etiqueta="Comuna" valor={filtros.id_ciudad ?? ''} onChange={(v) => cambiar('id_ciudad', v)} className={campo} disabled={!filtros.id_region}
                    opciones={[TODAS, ...ciudadesDeRegion.map((c) => ({ valor: String(c.id), texto: c.nombre }))]} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Tipo de propiedad
                <Desplegable etiqueta="Tipo de propiedad" valor={filtros.tipoVivienda ?? ''} onChange={(v) => cambiar('tipoVivienda', v as TipoVivienda)} className={campo}
                    opciones={[{ valor: '', texto: 'Casa o departamento' }, ...OPCIONES_TIPO]} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Precio desde {moneda && `(${moneda})`}
                <input type="number" min={0} inputMode="numeric" value={filtros.precioMin ?? ''} disabled={!moneda}
                    onChange={(e) => cambiar('precioMin', e.target.value)} placeholder={moneda ? 'Mínimo' : 'Elige operación'} className={campo} />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                Precio hasta {moneda && `(${moneda})`}
                <input type="number" min={0} inputMode="numeric" value={filtros.precioMax ?? ''} disabled={!moneda}
                    onChange={(e) => cambiar('precioMax', e.target.value)} placeholder={moneda ? 'Máximo' : 'Elige operación'} className={campo} />
            </label>

            <button type="button" onClick={() => setMasFiltros((v) => !v)} aria-expanded={masFiltros} aria-controls="mas-filtros"
                className="lg:hidden col-span-2 min-h-11 border rounded-lg bg-white text-sm font-medium">
                {masFiltros ? 'Menos filtros' : `Más filtros${extrasActivos ? ` (${extrasActivos})` : ''}`}
            </button>

            <div id="mas-filtros" className={masFiltros ? 'contents' : 'hidden lg:contents'}>
                <label className="flex flex-col gap-1 text-sm">
                    Ordenar por
                    <Desplegable etiqueta="Ordenar por" valor={filtros.orden ?? ''} onChange={(v) => cambiar('orden', v as Filtros['orden'])} className={campo}
                        opciones={ORDENES} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    Dormitorios
                    <Desplegable etiqueta="Dormitorios" valor={filtros.dormitorios ?? ''} onChange={(v) => cambiar('dormitorios', v)} className={campo}
                        opciones={[CUALQUIERA, ...MINIMOS]} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    Baños
                    <Desplegable etiqueta="Baños" valor={filtros.banos ?? ''} onChange={(v) => cambiar('banos', v)} className={campo}
                        opciones={[CUALQUIERA, ...MINIMOS.slice(0, 3)]} />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    Superficie mínima (m²)
                    <input type="number" min={0} inputMode="numeric" value={filtros.superficieMin ?? ''}
                        onChange={(e) => cambiar('superficieMin', e.target.value)} placeholder="Ej: 70" className={campo} />
                </label>

                <label className="flex items-center gap-2 text-sm self-end min-h-11">
                    <input type="checkbox" className="w-5 h-5" checked={filtros.mascotas === 'true'} onChange={(e) => cambiar('mascotas', e.target.checked ? 'true' : '')} />
                    Acepta mascotas
                </label>
            </div>

            <div className="col-span-2 flex gap-2 self-end">
                <button type="submit" className="flex-1 bg-marca text-white rounded-lg py-3 font-medium">Buscar</button>
                <button type="button" onClick={() => { setFiltros({}); router.push('/buscar'); }} className="px-4 border rounded-lg bg-white">
                    Limpiar
                </button>
            </div>
        </form>
    );
}
